---
title: "Speculative Decoding in Large Language Model Inference"
description: "Draft model generation, target model verification, latency reduction, and GPU memory bandwidth dynamics."
slug: "speculative-decoding-in-large-language-model-inference"
category: "ai"
tags:
  - "ai"
  - "gap-analysis"
  - "architecture"
difficulty: "Advanced"
readingTime: "11 min read"
published: "2026-10-19"
updated: "2026-10-19"
source: "knowledge-gap"
sourceUrl: ""
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-10-19T12:54:46Z"
version: "1.0"
---

## TL;DR

Speculative decoding mitigates the memory-bandwidth bottleneck of autoregressive Large Language Model (LLM) inference by pairing a small, computationally inexpensive draft model with a large target model. The draft model speculatively generates a sequence of $K$ candidate tokens at low latency, which the target model verifies concurrently in a single, high-arithmetic-intensity forward pass. By applying a modified rejection sampling scheme, speculative decoding preserves the target model's exact output probability distribution while achieving a 2–3× reduction in wall-clock latency for low-batch-size regimes.

---

## Problem

Autoregressive transformer inference generates text sequentially, one token per step. Each decoding step requires reading the entire parameter set of the model (e.g., 140 GB for a 70B parameter FP16 model) from High Bandwidth Memory (HBM) into SRAM to process a single query token ($N=1$).

$$\text{Arithmetic Intensity} = \frac{\text{FLOPs}}{\text{Bytes Transferred}} \approx \frac{2 \times P \times 1}{2 \times P} = 1 \text{ FLOP/Byte}$$

On modern accelerator hardware like an NVIDIA H100 SXM5 (3.35 TB/s HBM3 bandwidth, 989 TFLOPS FP16 Tensor Core compute), decoding is severely memory-bandwidth bound. Compute utilization routinely sits below 5% at batch size 1. Generation latency scales linearly with sequence length:

$$T_{\text{total}} = \sum_{i=1}^{N} t_{\text{step}, i}$$

Increasing memory throughput via tensor parallelism yields diminishing returns due to inter-GPU communication latency (All-Reduce overhead). Without changing the underlying memory access frequency per generated token, serving architectures face an intractable trade-off: compromise on latency, or provision massive, cost-inefficient GPU footprints to sustain acceptable interactive Time-To-First-Token (TTFT) and Time-Per-Output-Token (TPOT).

---

## Core Concept

Speculative decoding restructures the execution profile from memory-bound sequential execution to compute-bound parallel execution. It utilizes two distinct models sharing an identical vocabulary:
1. **Draft Model ($M_q$):** A compact model (e.g., 1B–7B parameters) optimized for low-latency token generation.
2. **Target Model ($M_p$):** The primary, high-capacity model (e.g., 70B–405B parameters) whose output distribution must be preserved.

```
Draft Model (Fast, low-capacity)
  ├── Step 1: Draft Token x1
  ├── Step 2: Draft Token x2
  └── Step 3: Draft Token x3
         │
         ▼
Target Model (Slow, high-capacity)
  └── Single Forward Pass: Verifies [x1, x2, x3] in parallel
         ├── Evaluates: p(x1), p(x2|x1), p(x3|x1, x2)
         └── Accepts or Rejects via Rejection Sampling
```

### Speculative Sampling Invariant
To ensure the output text is statistically indistinguishable from direct sampling from $M_p$, candidate tokens $x$ drawn from $q(x)$ are accepted or rejected according to the ratio of their probabilities under $M_p$ and $M_q$:

$$\alpha = \min\left(1, \frac{p(x \mid x_{<t})}{q(x \mid x_{<t})}\right)$$

* **Acceptance:** If a uniform random variable $U \sim \text{Uniform}(0, 1) \le \alpha$, the token is accepted.
* **Rejection:** If rejected at index $i$, the speculative stream truncates immediately. The token $x_i$ is resampled from the adjusted positive residual distribution:

$$p_{\text{resamp}}(x) = \frac{\max(0, p(x \mid x_{<i}) - q(x \mid x_{<i}))}{\sum_{x'} \max(0, p(x' \mid x_{<i}) - q(x' \mid x_{<i}))}$$

Tokens $x_{i+1} \dots x_K$ are discarded. This guarantees that the marginal distribution of the accepted token strictly equals $p(x \mid x_{<i})$:

$$\mathbb{P}(X = x) = q(x) \min\left(1, \frac{p(x)}{q(x)}\right) + (1 - \beta) p_{\text{resamp}}(x) = p(x)$$

where $\beta = \sum_{x} \min(p(x), q(x))$ is the token acceptance rate.

---

## How It Works

### Lifecycle and Data Flow

```
+-----------------------------------------------------------------------------------------+
|                                    Inference Engine                                     |
|                                                                                         |
|  [Context]                                                                              |
|     │                                                                                   |
|     ▼                                                                                   |
|  +-------------------+  K Autoregressive Steps   +-----------------------------------+  |
|  | Draft Engine      | ────────────────────────> | Candidate Sequence:               |  |
|  | (Small KV Cache)  |                           | [x_{t+1}, x_{t+2}, ..., x_{t+K}]  |  |
|  +-------------------+                           +-----------------------------------+  |
|                                                                    │                    |
|                                                                    ▼                    |
|  +-----------------------------------------------------------------------------------+  |
|  | Target Engine (Primary Model & Main KV Cache)                                     |  |
|  | Single Batched Forward Pass: Evaluates Prompt + K Candidates Concurrently         |  |
|  | Yields Logits: [L_{t+1}, L_{t+2}, ..., L_{t+K+1}]                                 |  |
|  +-----------------------------------------------------------------------------------+  |
|                                           │                                             |
|                                           ▼                                             |
|                     +-------------------------------------------+                       |
|                     | Vectorized Rejection Verification Step    |                       |
|                     +-------------------------------------------+                       |
|                                           │                                             |
|                     ┌─────────────────────┴─────────────────────┐                       |
|                     ▼                                           ▼                       |
|       All K Accepted:                             Rejection at index j (j <= K):        |
|       - Emit K candidates                         - Emit accepted tokens [x_1..x_{j-1}] |
|       - Sample extra bonus token from L_{t+K+1}   - Emit resampled token from residual  |
|       - Total: K + 1 tokens                       - Roll back KV cache by (K - j) slots |
+-----------------------------------------------------------------------------------------+
```

1. **Speculation Phase:** The draft model $M_q$ generates $K$ tokens autoregressively. Each step appends a key-value state to $M_q$'s dedicated KV cache.
2. **Batch Construction:** The original sequence concatenated with the $K$ speculative tokens is assembled into a single verification sequence.
3. **Verification Phase:** The target model $M_p$ runs a single forward pass over the $K$ candidate positions. It computes the logits for all $K$ candidates, plus one additional position ($t+K+1$).
4. **Rejection Cascade:** The runtime evaluates acceptance serially across $i \in [1, K]$.
   * If token $x_i$ passes, it is finalized.
   * If token $x_i$ fails, token $x_i$ is replaced by a sample from $p_{\text{resamp}}$, and candidates from $i+1$ to $K$ are invalidated.
   * If all $K$ tokens pass, a "bonus" token is sampled directly from $L_{t+K+1}$, yielding up to $K+1$ tokens in one target forward pass.
5. **State Synchronization:** Both the target and draft KV caches are rolled back to the index of the final accepted token plus one.

---

## Architecture

Speculative decoding alters the memory and compute topologies of LLM inference engines (e.g., vLLM, TensorRT-LLM).

```
+───────────────────────────────────────────────────────────────+
| Host / Gateway Service                                        |
|  └── Request Router -> Allocates Execution Context            |
+───────────────────────────────┬───────────────────────────────+
                                │
+───────────────────────────────▼───────────────────────────────+
| High-Bandwidth Accelerator Subsystem (e.g., 8x H100 Node)    |
|                                                               |
|  +─────────────────────────+   +───────────────────────────+  |
|  | Draft Context (GPU 0)   |   | Target Context (GPUs 0-7) |  |
|  | ----------------------- |   | ------------------------- |  |
|  | - Draft Weights: ~4 GB  |   | - Target TP: 8-way Sharded|  |
|  | - Private Paged KV      |   | - PagedAttention KV Cache |  |
|  | - Low Attention Overhead|   | - Shared HBM Allocation   |  |
|  +────────────┬────────────+   +─────────────┬─────────────+  |
|               │                              │                |
|               └────── Inter-Engine Sync ─────┘                |
|                       (IPC / P2P Tensor Copy)                 |
+───────────────────────────────────────────────────────────────+
```

### Component Boundaries and Interactions
* **Colocation:** To avoid multi-millisecond PCIe or InfiniBand latencies, draft weights reside either on the same GPU as the target (interleaved memory spaces) or across the same NVLink domain.
* **Unified Memory Allocators:** Inference runtimes use PagedAttention with copy-on-write or transactional block tables. The target and draft engines maintain parallel block tables. During rejection, discarding speculative allocations requires updating logical block mapping metadata without triggering host-device synchronizations.
* **Failure Isolation:** If the draft model crashes (e.g., CUDA OOM during speculation), the architecture falls back instantly to standard autoregressive decoding on the target model without dropping the client stream.

---

## Example

The following PyTorch implementation showcases the speculative verification step, vectorized probability adjustment, and cache rollback mechanisms.

```python
import torch
import torch.nn.functional as F
from typing import Tuple, Optional

@torch.no_grad()
def speculative_verify_and_sample(
    draft_tokens: torch.Tensor,        # Shape: [B, K]
    draft_logits: torch.Tensor,        # Shape: [B, K, Vocab]
    target_logits: torch.Tensor,       # Shape: [B, K + 1, Vocab]
    temperature: float = 1.0,
) -> Tuple[torch.Tensor, int]:
    """
    Executes vectorized speculative rejection sampling across K candidate tokens.
    
    Args:
        draft_tokens: Tensor of shape (B, K) containing speculative IDs.
        draft_logits: Tensor of shape (B, K, V) containing draft model output logits.
        target_logits: Tensor of shape (B, K + 1, V) containing target model output logits.
        temperature: Softmax sampling temperature.
        
    Returns:
        accepted_tokens: Tensor containing the sequence of validated and recovery tokens.
        num_accepted: Total count of accepted speculative tokens (excluding bonus/recovery).
    """
    B, K = draft_tokens.shape
    device = draft_tokens.device
    
    # Apply temperature scaling safely
    temp = max(temperature, 1e-5)
    p_prob = F.softmax(target_logits / temp, dim=-1)  # [B, K + 1, V]
    q_prob = F.softmax(draft_logits / temp, dim=-1)   # [B, K, V]

    accepted_list = []
    num_accepted = 0

    # Process step-by-step to honor serial rejection dependency
    for i in range(K):
        token_id = draft_tokens[:, i].unsqueeze(-1) # [B, 1]
        
        # Extract probabilities for the selected draft token
        p_tok = torch.gather(p_prob[:, i, :], dim=-1, index=token_id).squeeze(-1) # [B]
        q_tok = torch.gather(q_prob[:, i, :], dim=-1, index=token_id).squeeze(-1) # [B]
        
        # Vectorized rejection sampling threshold
        alpha = torch.clamp(p_tok / (q_tok + 1e-10), max=1.0)
        uniform_rand = torch.rand_like(alpha)
        
        # Condition check for acceptance
        is_accepted = uniform_rand <= alpha

        if is_accepted.all():
            accepted_list.append(token_id)
            num_accepted += 1
        else:
            # Rejection encountered: compute residual distribution
            # Residual: max(0, p - q) normalized
            residual = torch.clamp(p_prob[:, i, :] - q_prob[:, i, :], min=0.0)
            residual_sum = residual.sum(dim=-1, keepdim=True)
            
            # Numerical stability check: if residual sum is ~0, fallback to target distribution
            fallback_mask = residual_sum.squeeze(-1) < 1e-8
            normalized_residual = torch.where(
                fallback_mask.unsqueeze(-1),
                p_prob[:, i, :],
                residual / (residual_sum + 1e-10)
            )
            
            # Sample recovery token from adjusted residual distribution
            recovery_token = torch.multinomial(normalized_residual, num_samples=1)
            accepted_list.append(recovery_token)
            
            # Pipeline terminates: subsequent draft tokens are discarded
            break
    else:
        # Loop completed without rejection: sample bonus token from target position (K + 1)
        bonus_prob = p_prob[:, K, :]
        bonus_token = torch.multinomial(bonus_prob, num_samples=1)
        accepted_list.append(bonus_token)

    accepted_tokens = torch.cat(accepted_list, dim=-1)
    return accepted_tokens, num_accepted


# --- Verification Harness ---
if __name__ == "__main__":
    torch.manual_seed(42)
    Batch, K_spec, Vocab = 1, 4, 32000

    # Simulated draft predictions and logits
    mock_draft_tokens = torch.randint(0, Vocab, (Batch, K_spec))
    mock_draft_logits = torch.randn(Batch, K_spec, Vocab)
    
    # Target logits cover [x_1...x_K] verification positions plus position (K+1)
    mock_target_logits = torch.randn(Batch, K_spec + 1, Vocab)

    final_tokens, accepted_count = speculative_verify_and_sample(
        draft_tokens=mock_draft_tokens,
        draft_logits=mock_draft_logits,
        target_logits=mock_target_logits,
        temperature=0.7,
    )

    print(f"Speculation Horizon (K): {K_spec}")
    print(f"Accepted Speculative Tokens: {accepted_count}")
    print(f"Output Sequence Length: {final_tokens.shape[-1]}")
    print(f"Output Token IDs: {final_tokens.tolist()}")
```

---

## Common Pitfalls

1. **Vocabulary / Tokenizer Desynchronization:**
   * *Problem:* Draft and target models are trained with different tokenizers or subtle vocabulary offsets (e.g., Llama-2 vs. Llama-3 byte-level handling).
   * *Failure Mode:* The target model receives out-of-distribution token IDs, tanking acceptance rates to near 0% and corrupting generated text.
   * *Mitigation:* Assert strict equality of vocabulary mapping schemas and token boundaries during service registration:
     ```python
     assert target_tokenizer.get_vocab() == draft_tokenizer.get_vocab()
     ```

2. **Oversized Speculative Horizon ($K$):**
   * *Problem:* Static allocation of a high $K$ (e.g., $K=8$) under low acceptance probability domains (code generation, mathematics).
   * *Failure Mode:* Target model computes forward passes over wasted sequence lengths while the draft engine expends memory bandwidth sequentially, causing higher overall latency than baseline decoding ($Speedup < 1.0$).
   * *Mitigation:* Implement dynamic, EMA-driven speculation lengths:
     $$K_{t+1} = \text{clip}\left(\left\lfloor K_t \times \frac{\alpha}{\alpha_{\text{target}}}\right\rfloor, K_{\min}, K_{\max}\right)$$

3. **High-Concurrency Saturation:**
   * *Problem:* Running speculative decoding under high batch sizes ($B > 32$).
   * *Failure Mode:* High batch sizes push the target model out of the memory-bound regime and into the compute-bound regime. Parallel forward verification then competes for execution units (Tensor Cores), degrading overall system throughput.
   * *Mitigation:* Dynamically disable speculative decoding at the router level when active request queue depth exceeds hardware compute saturations.

4. **KV Cache Fragmentation and Sync Overhead:**
   * *Problem:* Naive implementation copying or creating deep copies of KV caches across speculation steps.
   * *Failure Mode:* GPU kernel launch and copy overhead overwhelms the latency gains.
   * *Mitigation:* Utilize zero-copy paged architectures (like vLLM’s virtual block tables) that track speculation using read-only head pointers and rollback state by modifying metadata arrays instead of memory buffers.

---

## Interview Questions

### Q1: Why does speculative decoding provably preserve the output distribution of the target model, and how does the residual sampling formulation prevent bias toward the draft model?
**Answer:**
Speculative decoding uses a generalized rejection sampling invariant. For any draft token $x \sim q(x)$, the acceptance probability is $\alpha = \min(1, p(x)/q(x))$. 

The probability of accepting a token under this scheme is:
$$\mathbb{P}(X=x, \text{accepted}) = q(x) \min\left(1, \frac{p(x)}{q(x)}\right) = \min(q(x), p(x))$$

If the token is rejected, the algorithm samples from a residual distribution:
$$p_{\text{resamp}}(x) = \frac{\max(0, p(x) - q(x))}{1 - \sum_{y} \min(p(y), q(y))}$$

Summing the probability of accepting $x$ directly and the probability of rejecting *some* draft token and drawing $x$ from the residual yields:
$$\mathbb{P}(X=x) = \min(q(x), p(x)) + (1 - \beta) \cdot \frac{p(x) - \min(q(x), p(x))}{1 - \beta} = p(x)$$
Because the sum equals $p(x)$ identically, no distribution shift is introduced, guaranteeing mathematical equivalence to target-only inference.

### Q2: What mathematically dictates the latency speedup factor of speculative decoding, and under what operational boundary conditions does the speedup become negative ($S < 1$)?
**Answer:**
Let $c$ be the cost (latency) ratio of one draft forward pass relative to one target forward pass ($c = t_q / t_p \ll 1$), $K$ be the speculative horizon, and $\alpha$ be the average token acceptance rate. The expected number of accepted tokens per round is:

$$\mathbb{E}[\text{tokens}] = \frac{1 - \alpha^{K+1}}{1 - \alpha}$$

The expected wall-clock time per round is $T = K \cdot t_q + t_p$. The effective speedup is:

$$S = \frac{\mathbb{E}[\text{tokens}] \cdot t_p}{K \cdot t_q + t_p} = \frac{1 - \alpha^{K+1}}{(1 - \alpha)(K \cdot c + 1)}$$

Speedup drops below 1.0 ($S < 1$) when:
1. **Low Acceptance:** $\alpha \to 0$ (e.g., target and draft outputs diverge significantly). In this case, $\mathbb{E}[\text{tokens}] \to 1$, reducing speedup to $S \approx \frac{1}{Kc + 1} < 1$.
2. **High Relative Draft Cost:** $c$ is large (the draft model is too large, e.g., 14B draft for 70B target).
3. **Compute Bound:** At high batch sizes, $t_p$ for verifying $K$ tokens is significantly greater than $t_p$ for 1 token due to saturation of GPU tensor cores, violating the assumption that batched verification costs $\approx$ 1 autoregressive step.

### Q3: How do you implement non-contiguous memory management for draft rollbacks within PagedAttention frameworks?
**Answer:**
PagedAttention organizes the KV cache into non-contiguous physical blocks managed via logical block tables. Speculative decoding exploits this by creating a snapshot of the logical block table pointers prior to entering the speculative loop:
1. The draft model allocates physical blocks from the free-block pool to store its $K$ speculative KV pairs.
2. The target model concurrently writes KV entries for the prompt and candidate tokens into its own mapped pages.
3. Upon rejection at token index $j < K$, the engine decrements the logical sequence length to $j$. 
4. The memory manager releases physical blocks allocated strictly past position $j$ back to the free list by updating block table metadata. No GPU-to-GPU memory copies or zeroing occurs; orphaned blocks are marked as free for subsequent allocations, completing rollback in $\mathcal{O}(1)$ host operations.

---

## Further Reading

* Leviathan, Y., Kalman, M., & Matias, Y. (2023). *Fast Inference from Transformers via Speculative Decoding.* International Conference on Machine Learning (ICML).
* Chen, C., Blem, S., Zheng, Z., et al. (2023). *Accelerating Large Language Model Decoding with Speculative Sampling.* arXiv:2302.01318.
* vLLM Project Team. *Speculative Decoding Architecture and Multi-GPU Orchestration in PagedAttention.* vLLM Core Documentation.
* Medusa Team. (2024). *Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads.* (Alternative architecture removing separate draft models).

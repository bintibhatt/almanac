"""
Mock AI provider for Almanac.
Provides deterministic, structured technical article generation without requiring
external API calls or API keys. Ideal for local development, tests, and CI/CD.
"""

from typing import Optional

from .base import BaseAIProvider


class MockAIProvider(BaseAIProvider):
    """
    Deterministic Mock provider that returns well-formatted engineering articles.
    """

    @property
    def name(self) -> str:
        return "mock"

    @property
    def default_model(self) -> str:
        return "mock-engine-v1"

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs,
    ) -> str:
        # Extract topic from prompt if possible
        topic_title = "Engineering Concept"
        for line in prompt.splitlines():
            if line.lower().startswith("topic:"):
                topic_title = line.split(":", 1)[1].strip()
                break

        return f"""## TL;DR

{topic_title} is a critical architectural component in modern systems engineering. It provides high-throughput, fault-tolerant processing and clear operational boundaries for scalable service communication.

## Problem

Building distributed, high-scale software requires reliable coordination, decoupled communication, and predictable failure domains. Without {topic_title}, systems often encounter:
- Tight coupling between upstream producers and downstream consumers.
- Cascading failures during sudden traffic spikes or database latency.
- Inability to replay or audit state transitions without heavy database overhead.

## Core Concept

At its core, {topic_title} solves these engineering constraints by enforcing:
1. **Separation of Concerns**: Producers emit state changes independently of consumer processing rates.
2. **Deterministic State Representation**: Information is modeled immutably, ensuring consistent read models.
3. **Backpressure Handling**: Consumers control ingestion throughput based on available capacity.

## How It Works

The lifecycle of {topic_title} operates in three distinct phases:

1. **Ingestion & Validation**: Incoming requests are sanitized, validated against schema definitions, and acknowledged.
2. **Buffer / Storage**: Events or data entities are committed to persistent storage with linear index ordering.
3. **Dispatch & Consumption**: Subscriber groups read sequential offsets, maintaining checkpoint markers for at-least-once or exactly-once delivery guarantees.

```
[Producer Client] ───(HTTP / gRPC)───▶ [Ingress Layer]
                                              │
                                              ▼
                                    [{topic_title} Engine]
                                              │
                       ┌──────────────────────┴──────────────────────┐
                       ▼                                             ▼
             [Consumer Worker 1]                           [Consumer Worker 2]
```

## Architecture

In production architectures, {topic_title} interfaces directly with load balancers, caching layers, and durable datastores:

- **Ingress Gateway**: Terminates TLS and performs initial rate-limiting.
- **Coordination Node**: Manages cluster membership, partition leases, and failover elections.
- **Worker Pool**: Asynchronous background processes processing workloads off the critical path.

## Example

The following production-ready Python example demonstrates configuring and interacting with {topic_title}:

```python
import time
from typing import Dict, Any

class {topic_title.replace(' ', '').replace('-', '')}Client:
    def __init__(self, endpoint: str, timeout: int = 5):
        self.endpoint = endpoint
        self.timeout = timeout
        self.connected = False

    def connect(self) -> None:
        # Simulate connection handshake
        self.connected = True
        print(f"Connected to {topic_title} at {{self.endpoint}}")

    def execute_operation(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.connected:
            raise ConnectionError("Client is not connected.")
        
        # Process payload
        result = {{
            "status": "success",
            "topic": "{topic_title}",
            "processed_at": time.time(),
            "payload_size": len(payload),
        }}
        return result

# Usage
client = {topic_title.replace(' ', '').replace('-', '')}Client(endpoint="localhost:8080")
client.connect()
response = client.execute_operation({{"event": "system_init", "priority": 1}})
print("Operation response:", response)
```

## Common Pitfalls

- **Unbounded Growth**: Failing to configure retention policies or compaction leads to disk exhaustion.
- **Ignoring Poison Pills**: Not having dead-letter queues (DLQ) causes unprocessable payloads to block worker loops.
- **Over-fetching**: Consumers requesting large batches can trigger out-of-memory (OOM) exceptions during traffic surges.
- **Lack of Observability**: Neglecting to track consumer lag and processing latency prevents timely autoscaling.

## Interview Questions

1. **How does {topic_title} handle network partitions between coordination nodes and workers?**
   *Answer*: Nodes typically use quorum-based consensus (such as Raft or Paxos) to prevent split-brain scenarios, rejecting writes if a majority partition is unreachable.

2. **What are the tradeoffs between at-least-once and exactly-once processing in this context?**
   *Answer*: At-least-once requires idempotent consumers and has lower coordination overhead, whereas exactly-once incurs performance penalties due to two-phase commits or distributed transaction logs.

3. **When would you choose an alternative approach over {topic_title}?**
   *Answer*: When system requirements mandate synchronous point-to-point confirmation with sub-millisecond latencies and low throughput where distributed buffering adds unnecessary complexity.

## Further Reading

- Official Documentation and Architectural Whitepapers
- Designing Data-Intensive Applications (Martin Kleppmann)
- Distributed Systems Patterns & Production Postmortems
"""

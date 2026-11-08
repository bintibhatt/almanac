---
title: "Tech Interview Handbook — Architecture & Patterns"
description: "Curated coding interview preparation materials for busy software engineers"
slug: "tech-interview-handbook-architecture-patterns"
category: "system-design"
tags:
  - "github"
  - "typescript"
  - "architecture"
difficulty: "Intermediate"
readingTime: "4 min read"
published: "2026-11-08"
updated: "2026-11-08"
source: "github"
sourceUrl: "https://github.com/yangshun/tech-interview-handbook"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-11-08T13:12:19Z"
version: "1.0"
---

## TL;DR
Architecture and pattern fluency is the primary differentiator between mid-level engineers and Staff+ roles in high-stakes interviews. This guide synthesizes how to map distributed system invariants—availability, consistency, and partitioning—into actionable, interview-ready architectural designs.

## Problem
In technical interviews, candidates often fail not due to a lack of coding ability, but due to "Scope Drift" and "Abstraction Collapse." Without a structured approach to architectural design, engineers often:
*   **Over-engineer prematurely:** Introducing distributed consensus protocols for low-scale, read-heavy workloads.
*   **Ignore Failure Domains:** Designing systems that assume perfect network and hardware reliability, leading to catastrophic cascading failures under simulated fault injection.
*   **Miscalculate Trade-offs:** Failing to articulate the cost of consistency (e.g., CAP/PACELC) in the context of latency-sensitive user journeys.

The result is an inability to defend design decisions when challenged by interviewers, leading to a breakdown in signal during the assessment process.

## Core Concept
Architectural design is the rigorous application of trade-offs under constraints. The core invariant is the **System Design Triangle**:
1.  **Scalability:** Horizontal vs. Vertical expansion, partitioning (sharding) strategies, and load balancing mechanics.
2.  **Reliability:** Redundancy, fault tolerance (circuit breakers, retries), and graceful degradation.
3.  **Efficiency:** Resource utilization (IOPS, memory bandwidth, CPU cycles), cache hit ratios, and tail latency (p99).

In an interview, you must navigate the **PACELC Theorem**: If there is a Partition (P), how do you choose between Availability (A) and Consistency (C)? Else (E), when the system is running normally, how do you manage the trade-off between Latency (L) and Consistency (C)?

## How It Works
The standard design pipeline flows from requirement extraction to component topology.

### Data Flow Diagram
```text
[Client] -> [API Gateway/Load Balancer]
               |
    +----------v----------+
    | Service Mesh / Auth |
    +----------+----------+
               |
    +----------v----------+      +------------------+
    | Application Logic   <------> Distributed Cache |
    +----------+----------+      +------------------+
               |
    +----------v----------+      +------------------+
    | Persistence Layer   <------> Async Event Bus  |
    +---------------------+      +------------------+
```

1.  **Ingress:** Termination of TLS, request routing based on path/header, and rate limiting.
2.  **Coordination:** State management via distributed locking or consensus (e.g., Raft/Paxos).
3.  **Persistence:** Writing to a primary store (WAL/SSTables) with asynchronous propagation to read replicas.

## Architecture
In a production system, these components are isolated by failure domains. 
*   **Boundary Isolation:** Decoupling read-heavy paths from write-heavy paths (CQRS) ensures that high traffic in the retrieval service does not starve the ingestion service of resources.
*   **Scaling:** Stateless application nodes allow for rapid horizontal scaling, while stateful services (databases) are partitioned based on high-cardinality keys (e.g., `user_id` or `tenant_id`) to prevent hotspots.

## Example
This TypeScript snippet demonstrates a `CircuitBreaker` pattern, essential for preventing cascading failures in downstream microservices.

```typescript
enum CircuitState { CLOSED, OPEN, HALF_OPEN }

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  async execute(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error("Circuit Open: Request rejected");
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }
}
```

## Common Pitfalls
1.  **Sharding on Low-Cardinality Keys:** Using `country` or `status` as a shard key leads to massive, unmanageable partitions (hotspots). **Mitigation:** Use high-cardinality keys like `user_id` or consistent hashing.
2.  **Ignoring N+1 Queries in Architectural Design:** Proposing an architecture that requires N database round trips for a single page load. **Mitigation:** Always specify batching or data loaders in the design.
3.  **Over-reliance on Synchronous Communication:** Chaining microservices in a synchronous request-response loop leads to high latency and tight coupling. **Mitigation:** Advocate for event-driven asynchronous processing for non-blocking operations.

## Interview Questions

### 1. Handling Distributed Transactions
**Question:** How do you maintain data integrity across two microservices without distributed locking (which ruins availability)?
**Answer:** Implement the **Saga Pattern**. Use a sequence of local transactions coordinated via events or messages. Include compensating transactions to roll back state if a later step fails, ensuring eventual consistency.

### 2. Tail Latency Mitigation
**Question:** You observe high p99 latency in a read-heavy service. How do you identify the root cause and address it?
**Answer:** Analyze the cache hit ratio and connection pool exhaustion. Use "Hedging Requests" (sending the same request to multiple replicas and taking the fastest result) or implement "Speculative Decoding" if the workload involves heavy inference.

## Further Reading
*   *Designing Data-Intensive Applications* by Martin Kleppmann (Foundational for consistency/partitioning models).
*   *The CAP Theorem* (Brewer's Conjecture) - Understanding the impossibility of perfect availability and consistency during partitions.
*   *Site Reliability Engineering (SRE) Handbook* by Google - Essential for grasping failure domains and service level objectives.

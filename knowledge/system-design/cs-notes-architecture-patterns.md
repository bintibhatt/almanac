---
title: "Cs Notes — Architecture & Patterns"
description: ":books: 技术面试必备基础知识、Leetcode、计算机操作系统、计算机网络、系统设计"
slug: "cs-notes-architecture-patterns"
category: "system-design"
tags:
  - "github"
  - "software-engineering"
  - "architecture"
difficulty: "Intermediate"
readingTime: "7 min read"
published: "2026-10-23"
updated: "2026-10-23"
source: "github"
sourceUrl: "https://github.com/CyC2018/CS-Notes"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-10-23T11:27:40Z"
version: "1.0"
---

## TL;DR
"Cs Notes — Architecture & Patterns" synthesizes foundational computer science principles—ranging from operating system primitives to distributed systems invariants—into practical blueprints for high-scale software engineering. It bridges the gap between academic theory and production-grade system design, enabling engineers to reason rigorously about consistency, concurrency, and resource bottlenecks. By mastering these core patterns, teams can prevent cascading failures, optimize memory and network footprints, and design resilient, horizontally scalable distributed architectures.

## Problem
Modern software systems frequently fail not from algorithmic inefficiency, but from poor architectural decisions regarding state management, concurrency control, and network boundaries. Engineers entering technical interviews or designing enterprise systems often rely on intuition rather than first principles. This leads to common production anti-patterns:
- **Thundering Herds and Cache Stampedes:** Uncoordinated cache invalidation or cold-start queries overloading downstream relational stores.
- **Unbounded Concurrency:** Thread-pool starvation and unthrottled goroutines or async tasks consuming all available memory, triggering OOM killers.
- **Split-Brain Scenarios:** Misconfigured consensus algorithms leading to data divergence during network partitions.
- **Head-of-Line (HoL) Blocking:** Poor multiplexing at the application or transport layer degrading tail latency (p99).

Without a structured mastery of computer science architecture and design patterns, teams build tightly coupled monoliths that cannot scale horizontally or fragile microservices that fail unpredictably under load.

## Core Concept
Architectural patterns are repeatable solutions to recurring design problems within a given context. They rely on core invariants spanning computer science domains:
1. **Concurrency vs. Parallelism:** Utilizing OS threads, coroutines, or event loops (e.g., epoll, io_uring) based on I/O-bound vs. CPU-bound workloads.
2. **The CAP Theorem & PACELC:** Recognizing that distributed systems must trade off Consistency, Availability, and Partition Tolerance, and even during normal operation (Else), must choose between Latency and Consistency.
3. **Data Locality and Memory Hierarchy:** Minimizing CPU cache misses (L1/L2/L3) and disk seeks by structuring data layout sequentially (e.g., Data-Oriented Design, LSM-trees vs. B-Trees).
4. **Backpressure:** Managing flow control explicitly across network boundaries to prevent consumer overload.

*Trade-off Matrix:*
- **Strong Consistency (Paxos/Raft):** High safety guarantees, but higher write latency and reduced availability under network partitions.
- **Eventual Consistency (CRDTs/Gossip):** High availability and low latency, but introduces read anomalies and conflict resolution complexity.

## How It Works
The execution pipeline of a robust distributed request processing architecture moves through distinct layers from ingress to persistence:

1. **Ingress & Edge:** Traffic hits a reverse proxy / API Gateway (e.g., Envoy) where TLS termination, rate limiting, and distributed tracing context propagation (W3C Trace Context) occur.
2. **Load Balancing & Compute:** Requests are routed to stateless application nodes using consistent hashing or least-connection algorithms. Concurrency is managed via non-blocking event loops or bounded worker pools.
3. **Caching & Storage Layer:** Application nodes check distributed caches (Redis/Memcached). Cache misses fall through to persistent stores governed by connection pools, circuit breakers, and read/write separation replicas.
4. **Coordination & State:** Distributed locks or consensus groups handle leader election and atomic state mutations.

```
[ Client ] 
    │
    ▼ (TLS / HTTP/2)
[ API Gateway / Load Balancer ] (Rate Limiting / Auth)
    │
    ▼ (RPC / gRPC)
[ Application Tier ] ──(Bounded Worker Pool)──► [ Distributed Cache (Redis) ]
    │                                                     │ (Cache Miss)
    ├─────────────────────────────────────────────────────┘
    ▼
[ Storage / Database Tier ] (Connection Pooling / Read Replicas)
```

Resource allocation is strictly budgeted: CPU bounds are managed via container cgroups, memory via garbage collection tuning or explicit allocation, and network bandwidth via connection multiplexing and compression.

## Architecture
In a modern production topology, architectural patterns act as the scaffolding linking client-facing gateways down to persistent storage engines. 

- **Upstream Integration:** Gateways enforce boundary isolation, preventing malformed requests or DDoS traffic from reaching core services. Circuit breakers isolate failing downstream dependencies, returning fallback responses or queuing requests safely.
- **Downstream Boundaries:** Interactions with relational databases, NoSQL datastores, and message brokers (e.g., Kafka) are governed by the Outbox Pattern or Saga pattern to maintain data integrity across distributed transactions without relying on expensive two-phase commits (2PC).
- **Failure Domains & Scaling:** Services are deployed across multiple Availability Zones (AZs) with stateless compute autoscaling based on custom metrics (e.g., queue depth or p99 latency) rather than just CPU utilization.

## Example
The following production-grade Go snippet demonstrates a robust worker pool with bounded concurrency, context-based cancellation, and panic recovery—embodying core concurrency and resilience patterns.

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"runtime/debug"
	"sync"
	"time"
)

// Task represents a unit of work entering the execution pipeline.
type Task struct {
	ID    int
	Payload string
}

// Result represents the outcome of a processed task.
type Result struct {
	TaskID int
	Output string
	Err    error
}

// WorkerPool implements a bounded concurrency execution pattern with graceful shutdown.
type WorkerPool struct {
	concurrency int
	taskChan    chan Task
	resultChan  chan Result
	wg          sync.WaitGroup
}

func NewWorkerPool(concurrency int, bufferSize int) *WorkerPool {
	return &WorkerPool{
		concurrency: concurrency,
		taskChan:    make(chan Task, bufferSize),
		resultChan:  make(chan Result, bufferSize),
	}
}

// Start spawns the worker goroutines.
func (wp *WorkerPool) Start(ctx context.Context) {
	for i := 1; i <= wp.concurrency; i++ {
		wp.wg.Add(1)
		go wp.worker(ctx, i)
	}
}

func (wp *WorkerPool) worker(ctx context.Context, id int) {
	defer wp.wg.Done()

	// Recover from panics to prevent worker-pool collapse (Defensive Engineering)
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("[Worker %d] PANIC recovered: %v\n%s\n", id, r, debug.Stack())
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case task, ok := <-wp.taskChan:
			if !ok {
				return
			}
			// Execute task with error handling simulation
			res, err := processTask(ctx, task)
			wp.resultChan <- Result{
				TaskID: task.ID,
				Output: res,
				Err:    err,
			}
		}
	}
}

func processTask(ctx context.Context, t Task) (string, error) {
	if t.ID < 0 {
		return "", errors.New("invalid task ID: negative value")
	}
	// Simulate I/O bound workload
	select {
	case <-time.After(50 * time.Millisecond):
		return fmt.Sprintf("Processed: %s", t.Payload), nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}

func (wp *WorkerPool) Submit(t Task) {
	wp.taskChan <- t
}

func (wp *WorkerPool) Stop() {
	close(wp.taskChan)
	wp.wg.Wait()
	close(wp.resultChan)
}
```

## Common Pitfalls
1. **Unbounded Queues:** Allowing task queues to grow infinitely without backpressure leads to memory exhaustion. *Mitigation:* Always use bounded channels/queues and reject or shed load when capacity is reached.
2. **Ignoring Tail Latency (p99):** Optimizing solely for average (p50) latency masks garbage collection pauses, lock contention, or slow disk I/O. *Mitigation:* Instrument distributed traces and monitor p95/p99/p99.9 metrics.
3. **Leaking Goroutines / Threads:** Spawning background goroutines without a cancellation mechanism (`context.Context` or quit channels). *Mitigation:* Ensure every spawned routine has a clear termination path tied to parent lifecycles.
4. **Improper Connection Pool Sizing:** Setting database connection pools too high overwhelms database CPU/memory; setting them too low creates artificial bottlenecks. *Mitigation:* Size pools based on `Connections = ((Core Count * 2) + Effective Spindle Count)` and benchmark under realistic concurrency.

## Interview Questions

### Question 1 (Intermediate): 
How would you design a rate limiter for a distributed API gateway supporting millions of requests per second, and what are the trade-offs between Token Bucket, Leaky Bucket, and Fixed Window algorithms?

**Model Answer:**
At scale, a distributed rate limiter cannot rely on local in-memory counters due to state synchronization issues across nodes. Instead, it requires a centralized or partitioned datastore like Redis using Lua scripts for atomic operations. 
- *Fixed Window:* Simple to implement using Redis INCR + EXPIRE, but suffers from race conditions and traffic bursts at window boundaries (2x limit can pass).
- *Sliding Window Log / Counter:* Smooths out spikes by maintaining timestamps or weighted averages, but incurs higher memory overhead.
- *Token Bucket:* Allows burstiness up to a configured capacity while maintaining a steady long-term rate. Ideal for API gateways.
- *Leaky Bucket:* Enforces a strict, constant processing output rate, which can add unnecessary latency to bursty human-driven traffic.

### Question 2 (Staff): 
Explain how you would prevent cascading failures in a microservices architecture when a critical downstream database experiences a 10x latency spike.

**Model Answer:**
Preventing cascading failures requires a multi-layered defense strategy:
1. **Circuit Breakers:** Implement state machines (Closed, Open, Half-Open) at the client boundary using libraries like Resilience4j or Istio service mesh. When error rates or latencies exceed a threshold, fail fast without hitting the degraded dependency.
2. **Timeouts & Deadlines:** Propagate strict timeouts down the call stack using context propagation (e.g., gRPC deadlines) so upstream services don't accumulate hanging requests.
3. **Bulkheading:** Isolate resource pools (threads, connections, memory) per downstream dependency so a failure in Service A cannot exhaust resources needed by Service B.
4. **Load Shedding & Graceful Degradation:** Drop non-critical background traffic or return degraded cached responses rather than failing entirely.

## Further Reading
- *Designing Data-Intensive Applications* by Martin Kleppmann (O'Reilly)
- *The Google File System* (Google Research seminal paper on distributed storage architecture)
- *Patterns of Enterprise Application Architecture* by Martin Fowler
- *RFC 7230-7235: Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content* (IETF Architecture Standards)

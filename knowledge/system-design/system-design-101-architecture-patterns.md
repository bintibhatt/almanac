---
title: "System Design 101 — Architecture & Patterns"
description: "Explain complex systems using visuals and simple terms. Help you prepare for system design interviews."
slug: "system-design-101-architecture-patterns"
category: "system-design"
tags:
  - "github"
  - "software-engineering"
  - "architecture"
difficulty: "Intermediate"
readingTime: "7 min read"
published: "2026-11-10"
updated: "2026-11-10"
source: "github"
sourceUrl: "https://github.com/ByteByteGoHq/system-design-101"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-11-10T14:45:16Z"
version: "1.0"
---

## TL;DR
System Design 101 establishes the foundational architectural patterns—such as load balancing, sharding, and service discovery—required to scale distributed systems horizontally under high-throughput conditions. By decoupling stateless compute from stateful persistence and introducing predictable routing layers, these patterns prevent single points of failure and resource saturation. Their primary production benefit is deterministic availability, enabling systems to gracefully handle arbitrary traffic spikes and node churn without data corruption.

## Problem
As user bases grow, monolithic applications operating against a single relational database hit hard hardware limits: CPU exhaustion, memory contention, I/O bottlenecks, and single-point-of-failure (SPOF) vulnerabilities. 

Without foundational system design patterns, scaling introduces severe failure modes:
- **Connection Storms & Database Lock Contention:** Direct client connectivity to monolithic databases leads to exhausted connection pools, lock wait timeouts, and cascading outages.
- **Hotspotting:** Uneven data distribution across storage nodes creates localized latency spikes, causing downstream services to time out even when global cluster capacity is underutilized.
- **Discovery Failures:** Static IP configurations fail immediately in dynamic cloud environments where auto-scaling groups (ASGs) continuously spin up and terminate compute instances.

Failing to apply decoupled, distributed patterns results in brittle architectures where a localized infrastructure failure cascades into a total system outage.

## Core Concept
System Design 101 revolves around distributed systems primitives that manage state, route traffic, and partition data. The core invariants are **Horizontal Scalability**, **Fault Isolation**, and **Decoupled Lifecycle Management**.

- **Load Balancers (LBs):** Act as the ingress traffic directors, distributing client requests across downstream server pools using algorithms like Round Robin, Least Connections, or Consistent Hashing.
- **Service Discovery:** Maintains a dynamic registry of healthy service instances, bridging the gap between ephemeral compute nodes and dependent clients via client-side or server-side discovery mechanisms.
- **Data Sharding:** Horizontally partitions large datasets across multiple independent database instances based on a deterministic sharding key to distribute read and write throughput.

### Key Trade-Offs (CAP Theorem)
Distributed architectures force trade-offs between **Consistency**, **Availability**, and **Partition Tolerance**. Because network partitions are inevitable in production, systems must choose between consistency (CP systems reject requests during splits to prevent split-brain) and availability (AP systems return stale data to maintain uptime).

## How It Works
1. **Lifecycle / Data Flow:**
   - A client issues an HTTP/gRPC request destined for the domain.
   - The DNS resolves the domain to an external Load Balancer (Layer 4 or Layer 7).
   - The Load Balancer queries its health-check registry (populated via Service Discovery) to filter out unhealthy nodes.
   - The request is routed to an available stateless API Gateway/Compute instance.
   - The compute instance queries the Service Discovery registry to locate the correct database shard.
   - The database executes the query, returns the payload, and the response flows back through the stack.

2. **State Transitions & Coordination:**
   - Stateless application nodes handle ingress, executing atomic transactions against distributed data stores using consensus algorithms (e.g., Raft) or eventual consistency patterns (e.g., CQRS).

3. **Resource Handling:**
   - LBs offload TLS termination, saving CPU cycles on backend servers. Caches (e.g., Redis) sit in front of database shards to absorb high-frequency read traffic and bound memory utilization.

```
[ Client ] 
    │
    ▼
[ Load Balancer (L4/L7) ] 
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
[ Compute Node A ] [ Compute Node B ] [ Compute Node C ]
    │              │              │
    └──────────────┼──────────────┘
                   │ (Service Discovery & Routing)
                   ▼
         [ Sharded Data Tier ]
         ├── Shard 1 (Users A-M)
         └── Shard 2 (Users N-Z)
```

## Architecture
In a modern production environment, System Design patterns form distinct architectural layers:
- **Ingress Layer:** Global Anycast DNS and Layer 7 Load Balancers handle rate limiting, WAF filtering, and traffic distribution.
- **Application Tier:** Stateless microservices deployed across multiple availability zones (AZs), orchestrated via Kubernetes. They interact via internal Load Balancers and gRPC.
- **Discovery Tier:** Distributed key-value stores (e.g., etcd, Consul) maintain real-time health and endpoint states.
- **Storage Tier:** Polyglot persistence layers featuring read replicas, sharded transactional databases, and distributed caching clusters with strict zone-isolation boundaries.

## Example
The following Go implementation demonstrates a production-grade consistent hashing ring used for service discovery and data sharding, featuring clean error handling and deterministic node assignment.

```go
package main

import (
	"crypto/sha256"
	"encoding/binary"
	"errors"
	"fmt"
	"sort"
	"sync"
)

var (
	ErrNodeNotFound = errors.New("node not found on hash ring")
	ErrEmptyRing    = errors.New("hash ring contains no nodes")
)

// HashRing implements a consistent hashing algorithm for sharding or service discovery.
type HashRing struct {
	mu       sync.RWMutex
	replicas int
	ring     []uint32 // Sorted list of hash values
	hashMap  map[uint32]string
}

func NewHashRing(replicas int) *HashRing {
	return &HashRing{
		replicas: replicas,
		hashMap:  make(map[uint32]string),
	}
}

// hash generates a uint32 hash for a given string key using SHA-256.
func (h *HashRing) hash(key string) uint32 {
	sum := sha256.Sum256([]byte(key))
	return binary.BigEndian.Uint32(sum[:4])
}

// AddNode adds a physical node and its virtual replicas to the ring.
func (h *HashRing) AddNode(node string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for i := 0; i < h.replicas; i++ {
		virtualKey := fmt.Sprintf("%s#%d", node, i)
		hashVal := h.hash(virtualKey)
		h.ring = append(h.ring, hashVal)
		h.hashMap[hashVal] = node
	}
	sort.Slice(h.ring, func(i, j int) bool {
		return h.ring[i] < h.ring[j]
	})
}

// GetNode locates the appropriate physical node for a given request key.
func (h *HashRing) GetNode(key string) (string, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if len(h.ring) == 0 {
		return "", ErrEmptyRing
	}

	hashVal := h.hash(key)

	// Binary search for the first node with a hash >= hashVal
	idx := sort.Search(len(h.ring), func(i int) bool {
		return h.ring[i] >= hashVal
	})

	// If the hash is larger than all nodes on the ring, wrap around to the first node
	if idx == len(h.ring) {
		idx = 0
	}

	node, exists := h.hashMap[h.ring[idx]]
	if !exists {
		return "", ErrNodeNotFound
	}

	return node, nil
}

func main() {
	ring := NewHashRing(3) // 3 virtual nodes per physical node for even distribution
	ring.AddNode("db-shard-01")
	ring.AddNode("db-shard-02")
	ring.AddNode("db-shard-03")

	clientKey := "user_account_987654"
	assignedNode, err := ring.GetNode(clientKey)
	if err != nil {
		fmt.Printf("Error resolving node: %v\n", err)
		return
	}

	fmt.Printf("Key '%s' routed to: %s\n", clientKey, assignedNode)
}
```

## Common Pitfalls
- **Choosing a Poor Sharding Key:** Selecting a high-cardinality key like `timestamp` or a low-cardinality key like `country` results in massive data skew (hotspotting). *Mitigation:* Use composite keys or application-level hashing to ensure uniform distribution.
- **Aggressive Health-Check Timeouts:** Configuring excessively aggressive health checks in service discovery can lead to cascading failures where transient network jitter triggers a thundering herd of node deregistrations. *Mitigation:* Implement sliding-window failure thresholds and exponential backoff.
- **Ignoring Load Balancer Connection Draining:** Abruptly terminating backend instances without connection draining drops active client transactions in flight. *Mitigation:* Enable graceful shutdown protocols and connection draining windows on all ingress layers.
- **Relying Solely on Local Caches:** Over-caching without invalidation strategies leads to stale reads in multi-region architectures. *Mitigation:* Implement distributed cache invalidation (e.g., Redis Pub/Sub or TTL-based expiration boundaries).

## Interview Questions
### Question 1: Distributed Sharding Hotspots
*How would you handle a sudden traffic spike targeting a single sharded database key (e.g., a viral product ID on an e-commerce platform) that is causing CPU exhaustion on Shard 03?*

**Model Answer:**
1. **Immediate Mitigation:** Introduce a localized in-memory cache (like Redis or an application-tier local LRU cache) in front of Shard 03 to absorb identical read requests.
2. **Write Mitigation:** If writes are the bottleneck, implement application-level request coalescing or write buffering. For extreme read skew, mirror the hot partition across multiple read replicas.
3. **Long-Term Architecture:** Implement dynamic re-sharding or virtual node splitting to break the hot key out of its static boundary, or apply a salt prefix to the key to distribute loads across multiple shards.

### Question 2: Service Discovery Failures
*During a network partition, your service discovery cluster splits. Half of your microservices believe the database cluster is down, while the other half can still reach it. How do you prevent split-brain and data corruption?*

**Model Answer:**
1. **Consensus Protocols:** Ensure the service discovery and orchestration layers rely on strict quorum-based consensus engines (e.g., Raft via Consul or etcd) that automatically refuse writes if a partition drops the node count below a strict majority ($N/2 + 1$).
2. **Fencing Tokens:** Implement monotonic fencing tokens or generation numbers at the database storage layer. When a node attempts a write after a partition heals, the storage engine rejects stale generation tokens, preventing out-of-order mutations.

## Further Reading
- *Designing Data-Intensive Applications* by Martin Kleppmann (O'Reilly)
- *AWS Architecture Center: Load Balancing and Scaling Whitepapers*
- *The Chubby lock service for loosely-coupled distributed systems* (Google Research Paper)
- *Consisten Hashing and Random Trees: Distributed Caching Protocols on the Web* (Karger et al.)

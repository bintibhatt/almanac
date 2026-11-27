---
title: "Sharding - Best Practices"
description: "Comprehensive engineering guide to Sharding - Best Practices covering architecture, implementation, and best practices."
slug: "sharding---best-practices"
category: "system-design"
tags:
  - "system-design"
  - "sharding"
  - "best-practices"
difficulty: "Intermediate"
readingTime: "5 min read"
published: "2026-11-27"
updated: "2026-11-27"
source: "manual"
sourceUrl: ""
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-11-27T16:30:50Z"
version: "1.0"
---

## TL;DR
Sharding is the horizontal partitioning of data across multiple database instances to bypass the vertical scaling limits of a single node. When implemented correctly, it enables near-linear write throughput and storage capacity growth by distributing workload based on a deterministic partition key.

## Problem
In monolithic data architectures, vertical scaling (upgrading CPU, RAM, or IOPS on a single node) eventually hits a "glass ceiling" imposed by hardware limits and cost-prohibitive vertical resource scaling. 

Without sharding, high-concurrency systems suffer from:
1. **Contention:** Lock contention on shared indices or metadata locks degrades performance.
2. **I/O Saturation:** Disk throughput limits become the bottleneck for ACID-compliant transactions.
3. **Blast Radius:** A single maintenance task or hardware failure impacts the entire dataset, resulting in zero availability during incidents.
4. **Memory Exhaustion:** B-Tree index sizes exceed available RAM, causing catastrophic cache misses and performance degradation.

## Core Concept
Sharding decomposes a monolithic database into smaller, independent "shards." The core invariant is that every record must map uniquely and deterministically to a specific shard based on a **Shard Key**. 

Key concepts:
- **Shard Key:** The data attribute(s) used for routing. Choosing a high-cardinality key is critical to prevent "hot shards."
- **Hash-based Sharding:** Uses `hash(key) % N` to determine the shard. Ensures uniform distribution but makes range queries across the dataset inefficient.
- **Range-based Sharding:** Splits data into contiguous ranges. Efficient for queries like `BETWEEN`, but prone to hotspots if the key is time-series or sequential.
- **Consistent Hashing:** Maps nodes and keys onto a logical ring to minimize data reshuffling when the number of shards changes.

## How It Works
The routing layer intercepts application queries and routes them to the appropriate storage node.

1. **Ingress:** The application provides a shard key.
2. **Routing:** A Shard Map or Hash function identifies the correct shard ID.
3. **Execution:** The request is dispatched to the specific shard.
4. **Aggregation:** (If required) The router collects results from multiple shards, merges the datasets, and returns them to the client.

```text
[App Client] -> [Router/Proxy Layer]
                     |
        +------------+------------+
        |            |            |
    [Shard 01]   [Shard 02]   [Shard 03]
  (Range A-M)  (Range N-Z)  (Replicas/Failover)
```

Resource handling focuses on **isolation**. Each shard operates as a siloed process, ensuring that CPU and Memory pressure on Shard A does not cause cascading failures on Shard B.

## Architecture
Sharding is typically implemented as a middleware or proxy layer (e.g., Vitess for MySQL, Citus for Postgres) situated between the application and the persistent storage layer.

- **Upstream:** Gateways/Load Balancers route traffic to application servers that are shard-aware.
- **Downstream:** Each shard should be a high-availability cluster (Master-Replica) to ensure fault tolerance.
- **Boundary Isolation:** Sharding should align with business domains. If a query requires joining across two shards, that is a design smell indicating an incorrectly chosen shard key or a requirement for denormalization.

## Example
A simple consistent hashing implementation in Go for routing requests to database nodes.

```go
package sharding

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"sort"
)

type HashRing struct {
	nodes []uint64
	mapTo map[uint64]string
}

// Route returns the storage node associated with a given key.
func (h *HashRing) Route(shardKey string) (string, error) {
	if len(h.nodes) == 0 {
		return "", fmt.Errorf("no shards available")
	}

	hash := hashKey(shardKey)
	// Find the first node with a hash >= key hash
	idx := sort.Search(len(h.nodes), func(i int) bool {
		return h.nodes[i] >= hash
	})

	// Wrap around to the first node if we reach the end of the ring
	if idx == len(h.nodes) {
		idx = 0
	}

	return h.mapTo[h.nodes[idx]], nil
}

func hashKey(key string) uint64 {
	h := sha256.Sum256([]byte(key))
	return binary.BigEndian.Uint64(h[:8])
}
```

## Common Pitfalls
1. **Hot Shards:** Choosing a key with low cardinality (e.g., `status_code` or `region` where one region has 90% of traffic).
   * *Mitigation:* Compound keys (e.g., `user_id + created_at`) to ensure high entropy.
2. **Cross-Shard Joins:** Attempting to execute SQL joins across shards via the application layer.
   * *Mitigation:* Denormalize data at write time or utilize a global secondary index table to maintain reference integrity.
3. **Resharding Complexity:** Scaling the cluster by adding shards requires massive data migration (rebalancing).
   * *Mitigation:* Use **Consistent Hashing** to minimize the number of keys that move during rebalancing and implement double-writing during migration windows.
4. **Ignoring Network Overhead:** The router/proxy layer itself becomes a latency bottleneck.
   * *Mitigation:* Use sidecar patterns or shard-aware clients that cache the shard map locally.

## Interview Questions
1. **Q: How do you handle a "hot shard" where one specific user ID accounts for 20% of all requests?**
   * *Model Answer:* You must break the deterministic nature of the shard key for that specific ID. Common techniques include "shard splitting" (migrating the key to its own dedicated node) or "key salting" (appending a random integer to the key to spread the load across multiple shards), though the latter complicates read-side lookups.

2. **Q: When is it better to use Range-based vs. Hash-based sharding?**
   * *Model Answer:* Hash-based is superior for uniform load distribution and avoiding hotspots in unpredictable write patterns. Range-based is superior for analytical workloads or scenarios requiring efficient range scans (e.g., "get all logs from the last 24 hours").

## Further Reading
1. **"Designing Data-Intensive Applications"** by Martin Kleppmann (Chapter 6: Partitioning).
2. **Vitess Documentation:** The industry standard for scaling MySQL via sharding.
3. **"Consistent Hashing and Random Trees: Distributed Caching Protocols for Relieving Hot Spots on the World Wide Web"** (Karger et al.).

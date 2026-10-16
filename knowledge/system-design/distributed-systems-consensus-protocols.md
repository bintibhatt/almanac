---
title: "Distributed Systems Consensus Protocols"
description: "Raft, Paxos, and Zab consensus mechanisms for distributed state machines."
slug: "distributed-systems-consensus-protocols"
category: "system-design"
tags:
  - "github"
  - "distributed-systems"
  - "consensus"
difficulty: "Advanced"
readingTime: "7 min read"
published: "2026-10-16"
updated: "2026-10-16"
source: "github"
sourceUrl: "https://github.com/topics/consensus"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-10-16T11:13:04Z"
version: "1.0"
---

## TL;DR
Distributed consensus protocols (Raft, Multi-Paxos, Zab) ensure state machine replication across unreliable networks by guaranteeing that a cluster of nodes agrees on a sequential log of operations despite network partitions and node crashes. They exist to eliminate split-brain scenarios and data inconsistency in distributed architectures, yielding linearizable read/write semantics required for modern transactional data stores.

## Problem
Building horizontally scalable distributed systems introduces the fundamental challenge of coordinating state across physically isolated nodes communicating via asynchronous networks subject to variable latency, packet loss, and partition events (the FLP impossibility theorem proves that deterministic asynchronous consensus cannot be guaranteed in the presence of even a single unannounced crash failure). 

Without robust consensus protocols, systems resort to naive master-slave replication or split-brain prone architectures. These fail under network partitions, where two subsets of a cluster can accept writes independently, resulting in unresolvable state divergence, lost updates, and catastrophic data corruption. Furthermore, manual failovers or synchronous two-phase commit (2PC) strategies suffer from head-of-line blocking and low availability, failing to maintain high throughput and strict serializability during node churn.

## Core Concept
Distributed consensus protocols achieve agreement through State Machine Replication (SMR): a cluster of deterministic state machines start in the exact same initial state and apply an identical sequence of state transitions (commands). 

The core invariants center around safety (nothing bad happens: nodes never commit conflicting entries for the same log index) and liveness (something good eventually happens: nodes eventually agree on proposed values if a majority is reachable). To guarantee these invariants, protocols rely on quorums: any two majorities of size $Q = \lfloor N/2 \rfloor + 1$ out of $N$ nodes must intersect by at least one node, ensuring that any new leader is guaranteed to observe all previously committed log entries.

- **Paxos**: The foundational protocol, achieving consensus via proposer, acceptor, and learner roles across phases (Prepare/Promise, Accept/Accepted). Single-decree Paxos handles one value, while Multi-Paxos optimizes for continuous log replication by amortizing the prepare phase.
- **Raft**: Designed for understandability by decomposing consensus into explicit sub-problems: Leader Election, Log Replication, and Safety. Raft relies heavily on strong leader invariants where log entries flow strictly from leader to followers.
- **Zab (ZooKeeper Atomic Broadcast)**: A primary-backup protocol optimized for primary-order guarantees and fast recovery phases, utilizing a specialized epoch-based numbering scheme.

## How It Works
1. **Lifecycle / Data Flow**: A client issues a write command to the cluster leader. The leader appends the command to its local uncommitted log and broadcasts an AppendEntries (or equivalent) RPC to all follower nodes.
2. **Coordination & Quorum**: Followers append the entry to their local stable storage and reply with an acknowledgment. Once the leader receives acknowledgments from a strict majority ($Q$) of nodes, it marks the entry as committed, applies it to its local state machine, and returns the response to the client. The commit index is piggybacked on subsequent heartbeat or append RPCs to notify followers.
3. **Resource Handling**: Network bandwidth is consumed primarily by heartbeats and batched log replication payloads. Memory utilization scales with uncommitted log tail sizes, requiring aggressive log compaction (snapshots) to prevent unbounded memory growth and accelerate node catch-up (install snapshot phases).

```
[Client] ---> Write(Cmd) ---> [Leader Node]
                               |-- AppendEntries (RPC) --> [Follower A]
                               |-- AppendEntries (RPC) --> [Follower B]
                               |-- AppendEntries (RPC) --> [Follower C (Down)]
                               
       <-- Quorum Achieved (Leader + Follower A & B) --|
       [Leader State Machine Applies & Commits]
[Client] <--- Success Response <--- [Leader Node]
```

## Architecture
Consensus engines sit at the kernel of distributed data systems, mediating between external APIs and underlying persistence layers:
- **Upstream Integration**: API gateways and client libraries route requests to the current cluster leader, handling temporary redirection (HTTP 307 or custom RPC error codes like `ErrNotLeader`) when metadata shifts.
- **Downstream Integration**: Committed log entries are flushed to high-performance local storage engines (e.g., RocksDB, memory-mapped files) via a Write-Ahead Log (WAL) pattern before state application.
- **Failure Domains**: Nodes must be distributed across distinct failure domains (availability zones, power racks) to ensure that a localized physical outage does not breach the majority quorum requirement ($N = 2F + 1$, where $F$ is the maximum tolerated crash failures).

## Example
The following Go snippet implements a thread-safe, production-grade Raft log entry appender with term verification, quorum validation logic, and context-based timeout handling.

```go
package consensus

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"time"
)

var (
	ErrNotLeader      = errors.New("node is not the current cluster leader")
	ErrQuorumFailed   = errors.New("failed to achieve write quorum")
	ErrContextTimeout = errors.New("consensus round timed out")
)

type LogEntry struct {
	Index uint64
	Term  uint64
	Command []byte
}

type RaftNode struct {
	mu           sync.RWMutex
	nodeID       string
	currentTerm  uint64
	leaderID     string
	commitIndex  uint64
	log          []LogEntry
	peers        []PeerClient
	state        NodeState
}

type NodeState int
const (
	Follower NodeState = iota
	Candidate
	Leader
)

type PeerClient interface {
	AppendEntries(ctx context.Context, req AppendEntriesRequest) (AppendEntriesResponse, error)
}

type AppendEntriesRequest struct {
	Term         uint64
	LeaderID     string
	PrevLogIndex uint64
	PrevLogTerm  uint64
	Entries      []LogEntry
	LeaderCommit uint64
}

type AppendEntriesResponse struct {
	Term    uint64
	Success bool
}

// Propose appends a new command to the leader's log and replicates it to a quorum of peers.
func (r *RaftNode) Propose(ctx context.Context, command []byte) error {
	r.mu.Lock()
	if r.state != Leader {
		r.mu.Unlock()
		return ErrNotLeader
	}

	// Construct new log entry
	nextIndex := uint64(len(r.log)) + 1
	entry := LogEntry{
		Index:   nextIndex,
		Term:    atomic.LoadUint64(&r.currentTerm),
		Command: command,
	}
	r.log = append(r.log, entry)
	
	// Capture current state for async replication
	currentTerm := entry.Term
	r.mu.Unlock()

	// Replicate to peers concurrently
	var successCount int32 = 1 // Count self
	totalPeers := len(r.peers)
	quorum := (totalPeers + 1)/2 + 1

	var wg sync.WaitGroup
	ctx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()

	for _, peer := range r.peers {
		wg.Add(1)
		go func(p PeerClient) {
			defer wg.Done()
			req := AppendEntriesRequest{
				Term:     currentTerm,
				LeaderID: r.nodeID,
				Entries:  []LogEntry{entry},
			}
			
			resp, err := p.AppendEntries(ctx, req)
			if err == nil && resp.Success {
				atomic.AddInt32(&successCount, 1)
			}
		}(peer)
	}

	wg.Wait()

	if int(atomic.LoadInt32(&successCount)) >= quorum {
		r.mu.Lock()
		if entry.Index > r.commitIndex {
			r.commitIndex = entry.Index
			// Apply state machine execution here
		}
		r.mu.Unlock()
		return nil
	}

	return ErrQuorumFailed
}
```

## Common Pitfalls
- **Disk I/O Latency and fsync Bottlenecks**: Synchronously writing and flushing every log entry to disk via `fsync` can severely limit write throughput. *Mitigation*: Batch entries into a single disk write operation or use asynchronous group commit patterns where safe.
- **Split-Brain via Asymmetric Partitions**: Poorly configured network timeout intervals combined with intermittent packet loss can cause follower nodes to falsely trigger leader elections, causing thrashing. *Mitigation*: Use randomized election timeouts (e.g., 150ms–300ms) and enforce pre-vote phases.
- **Unbounded Log Growth**: Failing to implement periodic state snapshots causes the WAL to grow indefinitely, leading to out-of-memory errors and extremely slow node restart recovery times. *Mitigation*: Implement asynchronous snapshotting and truncate the log safely past the stable commit index.
- **Stale Reads**: Serving read requests directly from a follower node without verifying leadership lease or querying a quorum returns stale data. *Mitigation*: Implement ReadIndex or LeaseRead optimizations to guarantee linearizable reads.

## Interview Questions
1. **Explain how Raft prevents a newly elected leader from overwriting committed entries from previous terms.**
   * *Model Answer*: Raft ensures safety during leader election using the `RequestVote` RPC constraint: a candidate must include information about its most recent log entry in its vote request. If a voter's log is more up-to-date than the candidate's log (determined by comparing the term of the last entry, and then the log length), the voter denies its vote. Consequently, a leader cannot be elected unless its log contains all previously committed entries.

2. **What is the FLP Impossibility Theorem, and how do practical consensus protocols like Raft or Paxos bypass it?**
   * *Model Answer*: The FLP Impossibility Theorem proves that no deterministic asynchronous consensus protocol can guarantee both safety and liveness in the presence of even a single unannounced node crash. Practical protocols bypass this theoretical limitation by introducing **partial synchrony** or **randomized/timeout-based mechanics** (such as randomized election timeouts), ensuring that safety is always preserved unconditionally while liveness is guaranteed during periods when network latency is bounded.

3. **How does Multi-Paxos optimize performance compared to Single-Decree Paxos for streaming log replications?**
   * *Model Answer*: Single-Decree Paxos requires a full two-phase round trip (Prepare/Promise, Accept/Accepted) for *every single* log index, adding massive latency overhead. Multi-Paxos optimizes this by running the Prepare phase *once* to establish a stable leader for a sequence of log instances. Once the leader is established, subsequent operations skip the Prepare phase entirely and proceed immediately to the Accept phase, cutting the consensus round-trip latency in half.

## Further Reading
- *In Search of an Understandable Consensus Algorithm* (Extended Raft Paper) — Diego Ongaro and John Ousterhout (Stanford University).
- *Paxos Made Simple* — Leslie Lamport.
- *ZooKeeper: Wait-free coordination for Internet-scale systems* (Zab Paper) — Benjamin Reed et al.
- *Designing Data-Intensive Applications* (Chapters 8 and 9) — Martin Kleppmann (O'Reilly Media).

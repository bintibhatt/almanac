---
title: "SeaStore: Redesigning Ceph's Storage Back End for CPU-Efficient NVMe Performance"
description: "Top Hacker News engineering discussion: SeaStore: Redesigning Ceph's Storage Back End for CPU-Efficient NVMe Performance."
slug: "seastore-redesigning-cephs-storage-back-end-for-cpu-efficient-nvme-performance"
category: "backend"
tags:
  - "hackernews"
  - "backend"
difficulty: "Intermediate"
readingTime: "12 min read"
published: "2026-11-24"
updated: "2026-11-24"
source: "hackernews"
sourceUrl: "https://dl.acm.org/doi/10.1145/3828523.3857112"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-11-24T17:29:03Z"
version: "1.0"
---

## TL;DR
SeaStore is the next-generation, log-structured storage backend engineered for Ceph's high-performance OSD rewrite, Crimson. Built from the ground up using the Seastar asynchronous framework, it eliminates CPU context-switching, thread contention, and double-write journaling overhead inherent in legacy engines like BlueStore. By mapping out-of-place updates through a lockless, shared-nothing architecture directly onto NVMe drives and Zoned Namespaces (ZNS), SeaStore extracts millions of IOPS per node with predictable tail latencies and minimal CPU-per-I/O usage.

## Problem
Modern storage media has fundamentally shifted the primary performance bottleneck in distributed block and object storage from disk I/O latency to host CPU utilization. Ceph’s incumbent backend, BlueStore, bypasses the Linux page cache and POSIX filesystems via raw block access and an embedded RocksDB key-value store for metadata. However, BlueStore scales poorly on fast NVMe drives (>1M IOPS) due to core architectural limitations:

1. **Thread Contention and Lock Escalation:** BlueStore relies on OS-level POSIX threads (`pthreads`), mutexes, and condition variables across worker pools, rocksdb background threads, and I/O submission threads. Cache-line bouncing and CPU context switches cap IOPS long before the hardware saturates.
2. **Metadata Write Amplification Factor (WAF):** RocksDB uses a Log-Structured Merge-tree (LSM-tree) requiring periodic compactions. Compactions consume massive CPU bandwidth and write endurance, competing directly with real-time payload I/O.
3. **Double-Write Journaling:** To maintain crash consistency for non-page-aligned writes, BlueStore must write data payloads twice (once to a Write-Ahead Log/WAL and once to the target location) or pay severe latency penalties for read-modify-write cycles.
4. **Hardware Misalignment with ZNS:** Flash Translation Layers (FTL) inside modern SSDs execute internal garbage collection, creating unpredictability. BlueStore cannot easily target hardware Zoned Namespaces (ZNS), which enforce append-only writes within sequential zones to bypass FTL overhead.

Without a redesign, enterprise storage clusters scaling to 100GbE/400GbE networks and Gen5 PCIe NVMe drives burn hundreds of CPU cores purely on software synchronization overhead.

## Core Concept
SeaStore replaces multi-threaded synchronization and foreign embedded key-value engines with a unified, log-structured, single-threaded per-core architecture (powered by the Seastar framework). 

```
                               Shared-Nothing Seastar Core (Shard N)
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                             │
 │   ┌──────────────────────┐      ┌─────────────────────────┐      ┌──────────────────────┐   │
 │   │ Transaction Manager  ├─────►│ Physical-to-Logical     ├─────►│ Segment Allocator    │   │
 │   │ (Delta Manager)      │      │ (L2P/P2L B-Tree Maps)   │      │ (Clean/Dirty Tracks) │   │
 │   └──────────┬───────────┘      └─────────────────────────┘      └──────────┬───────────┘   │
 └──────────────┼──────────────────────────────────────────────────────────────┼───────────────┘
                │ Async Submissions                                            │
                ▼                                                              ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │  NVMe / ZNS Flash Storage (Physical Partition)                                              │
 │ ┌───────────────────────────┬───────────────────────────┬─────────────────────────────────┐ │
 │ │ Segment 0 (Active Log)    │ Segment 1 (Data Extents)  │ Segment 2 (Clean Target Zone)   │ │
 │ │ [Delta_0][Delta_1][Append]│ [Extent_A][Extent_B]......│ [Free Space for GC Relocation]  │ │
 │ └───────────────────────────┴───────────────────────────┴─────────────────────────────────┘ │
 └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Invariants and Terminology
- **Shared-Nothing Threading Model:** Execution space is explicitly partitioned into CPU cores ("shards"). Each shard manages its own memory pool, data extents, and metadata trees without mutexes. Inter-shard communication uses lockless message queues.
- **Log-Structured Space Management:** Physical storage is sliced into large, fixed-size chunks called **Segments** (typically 32MB to 256MB). All writes—whether user data or metadata updates—are appended sequentially to the active segment.
- **Out-of-Place Updates via L2P/P2L Mapping:** Data is never mutated in place. Modifications write a new extent elsewhere on disk and update a high-performance in-memory and on-disk **L2P (Logical-to-Physical) B-Tree**. A corresponding **P2L (Physical-to-Logical) B-Tree** tracks back-references required for physical segment cleaning.
- **Delta-Based Metadata Journaling:** Rather than writing entire metadata nodes to disk, SeaStore emits fine-grained, self-describing **Deltas** into the log segment stream. Nodes are reconstructed in memory by applying deltas to base snapshots.
- **Segment Cleaning (Garbage Collection):** When free space drops below a threshold, background clean-up tasks scan cold segments, identify live extents via P2L references, relocate live data sequentially to a new active segment, and mark old segments as fully reusable (or reset zones on ZNS).

## How It Works

### 1. The Write Pipeline Lifecycle
When a client payload arrives at a SeaStore OSD shard:

1. **Transaction Initialization:** The request is packaged into a local transaction context. The transaction tracks pinned in-memory data extents and dirty metadata mutations.
2. **Delta Generation:** Modifying a key or object extent generates a structural mapping delta (e.g., `L2P_Insert(LogicalAddr, PhysicalAddr)`). No synchronous B-tree leaf node flush occurs yet.
3. **Extent Allocation:** The `SegmentAllocator` assigns an append position inside the core's assigned active physical Segment.
4. **Log Block Assembly:** Payload data buffers and accumulated transaction deltas are packed into a unified, DMA-aligned write block.
5. **Async Batch Submission:** The block is submitted directly to the NVMe queue pair assigned to that core via `io_uring` (or Seastar native reactor kernel bypass drivers). 
6. **In-Memory Tree Mutation & Commit:** Once the hardware issues an I/O completion interrupt/poll event, the in-memory L2P tree is updated with the committed state, and the transaction returns success to the client gateway.

### 2. State Transitions and Segment Relocation
Segments transit through strict states to maintain crash safety without double-writing:

```
[ Free / Empty ] ──► [ Active / Appending ] ──► [ Closed / Read-Only ]
       ▲                                                 │
       │ (Zone Reset / Reclaim)                          │ (GC Scanned)
       └────────────────── [ Cleaning ] ◄────────────────┘
```

- **Active:** Currently receiving DMA appends for deltas and data extents.
- **Closed:** Full segment; immutable. Contains a mix of valid (live) extents and invalidated (dead) extents replaced by newer writes.
- **Cleaning:** The Segment Cleaner reads the P2L index of the segment. Live extents are read and re-appended to the active segment via internal GC transactions.
- **Free:** Completely scrubbed of valid extents. Reclaims physical flash blocks (or executes a `ZONE_RESET` NVMe command on ZNS).

### 3. Memory, CPU, and Network Handling
- **CPU:** Zero lock acquisition on the read/write fast path. Core execution runs within an infinite Seastar polling loop, eliminating context switching overhead completely.
- **Memory:** Zero-copy data paths utilize DMA-capable buffer pools managed directly by Seastar allocators. Memory cache pages are tracked using epoch-based reference counting to safely clear or clean blocks without blocking active transactions.
- **Network:** Receives network I/O directly from DPDK or Seastar native TCP stacks via lockless CPU affinity queues aligned with the target storage shard.

## Architecture

SeaStore completely rewrites the storage backend layer inside Ceph Crimson. It eliminates the traditional abstraction boundary between metadata storage (formerly RocksDB) and raw data block allocation (formerly Kernel/BlueFS).

```
                                 [ Distributed Client Gateway / librbd ]
                                                   │
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Crimson OSD (C++20 Seastar Async Framework)                                                             │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ OSD Real-Time Replication Protocol (Shard-Aware Router)                                          │  │
│  └─────────────────────────────────┬────────────────────────────────────────────────────────────────┘  │
│                                    │ Lockless Cross-Core Messaging                                     │
│  ┌─────────────────────────────────▼────────────────────────────────────────────────────────────────┐  │
│  │ SeaStore Core Instance (1 Per Core Shard)                                                        │  │
│  │                                                                                                  │  │
│  │  ┌─────────────────────────────┐   ┌─────────────────────────────┐   ┌────────────────────────┐  │  │
│  │  │ Logical ObjectStore API     │   │ Transaction Manager         │   │ Cache / Memory Pool    │  │  │
│  │  └──────────────┬──────────────┘   └──────────────┬──────────────┘   └───────────┬────────────┘  │  │
│  │                 │                                 │                              │               │  │
│  │  ┌──────────────▼─────────────────────────────────▼──────────────────────────────▼────────────┐  │  │
│  │  │ Indexing Layer: Dual B-Trees (L2P: Logical-to-Physical | P2L: Physical-to-Logical)           │  │  │
│  │  └──────────────────────────────────────────────┬────────────────────────────────────────────┘  │  │
│  │                                                 │                                               │  │
│  │  ┌──────────────────────────────────────────────▼────────────────────────────────────────────┐  │  │
│  │  │ Segment Cleaner / Garbage Collection Engine                                               │  │  │
│  │  └──────────────────────────────────────────────┬────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┼───────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┼──────────────────────────────────────────────────┘
                                                     │ io_uring / Direct NVMe Driver Submissions
                                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Block Device Media Layer (NVMe SSD / Persistent Memory / Zoned Namespaces)                             │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Failure Domains and Isolation
- **Core Isolation:** Memory corruptions or engine panics within one shard are scoped strictly to that core's partition of Placement Groups (PGs).
- **Crash Recovery:** Upon ungraceful shutdown, SeaStore scans the trailing end of the active segment journal from the last checkpoint. It replays structural deltas sequentially to reconstruct the in-memory L2P B-tree state without executing long filesystem checks.

## Example

The following production-grade C++20 conceptual implementation demonstrates a high-performance, asynchronous log-structured transaction pipeline utilizing delta logging, memory alignment, and explicit state handling based on SeaStore architectural patterns:

```cpp
#include <iostream>
#include <vector>
#include <memory>
#include <cstdint>
#include <system_error>
#include <expected>
#include <span>
#include <concepts>

// System constants for NVMe page-aligned physical structures
constexpr size_t PAGE_SIZE = 4096;
constexpr uint32_t SEGMENT_SIZE_MB = 64;
constexpr uint64_t SEGMENT_BYTES = SEGMENT_SIZE_MB * 1024 * 1024;

using paddr_t = uint64_t; // Physical byte offset on device
using laddr_t = uint64_t; // Logical Object Address

enum class DeltaType : uint8_t {
    L2P_INSERT = 0x01,
    L2P_INVALIDATE = 0x02,
    DATA_EXTENT = 0x03
};

#pragma pack(push, 1)
struct DeltaHeader {
    DeltaType type;
    laddr_t logical_addr;
    paddr_t physical_addr;
    uint32_t length;
};
#pragma pack(pop)

struct PendingExtent {
    laddr_t laddr;
    std::vector<uint8_t> payload;
};

// Represents a non-blocking transaction running on a dedicated Seastar core shard
class SeaStoreTransaction {
public:
    explicit SeaStoreTransaction(uint64_t tx_id) : transaction_id(tx_id) {}

    void add_write(laddr_t laddr, std::span<const uint8_t> data) {
        PendingExtent extent{
            .laddr = laddr,
            .payload = std::vector<uint8_t>(data.begin(), data.end())
        };
        extents.push_back(std::move(extent));
    }

    [[nodiscard]] const std::vector<PendingExtent>& get_extents() const { return extents; }
    [[nodiscard]] uint64_t id() const { return transaction_id; }

private:
    uint64_t transaction_id;
    std::vector<PendingExtent> extents;
};

// Core Segment Allocator tracking out-of-place sequential appends
class SegmentAllocator {
public:
    explicit SegmentAllocator(paddr_t base_offset) 
        : base_paddr(base_offset), write_head(base_offset) {}

    std::expected<paddr_t, std::errc> allocate(size_t bytes) {
        // Enforce Direct-I/O Alignment
        size_t aligned_bytes = (bytes + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);

        if ((write_head - base_paddr) + aligned_bytes > SEGMENT_BYTES) {
            return std::unexpected(std::errc::no_space_on_device);
        }

        paddr_t allocated_at = write_head;
        write_head += aligned_bytes;
        return allocated_at;
    }

    [[nodiscard]] paddr_t get_head() const { return write_head; }

private:
    paddr_t base_paddr;
    paddr_t write_head;
};

// Simplified Engine representation for Delta Logging and Direct Direct I/O Append
class CoreShardEngine {
public:
    explicit CoreShardEngine(uint32_t shard_id, paddr_t physical_base)
        : shard_id(shard_id), allocator(physical_base) {}

    // Executes a non-blocking submission step for a transaction
    std::expected<paddr_t, std::errc> commit_transaction(SeaStoreTransaction& tx) {
        // 1. Calculate required buffer length (Deltas + Payloads)
        size_t total_payload_bytes = 0;
        for (const auto& ext : tx.get_extents()) {
            total_payload_bytes += sizeof(DeltaHeader) + ext.payload.size();
        }

        // 2. Reserve continuous physical block in current active segment
        auto alloc_res = allocator.allocate(total_payload_bytes);
        if (!alloc_res) {
            return std::unexpected(alloc_res.error());
        }
        paddr_t target_paddr = alloc_res.value();

        // 3. Assemble unified direct DMA payload buffer
        std::vector<uint8_t> dma_buffer;
        dma_buffer.reserve((total_payload_bytes + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1));

        paddr_t current_data_cursor = target_paddr + (tx.get_extents().size() * sizeof(DeltaHeader));

        for (const auto& ext : tx.get_extents()) {
            DeltaHeader header{
                .type = DeltaType::DATA_EXTENT,
                .logical_addr = ext.laddr,
                .physical_addr = current_data_cursor,
                .length = static_cast<uint32_t>(ext.payload.size())
            };

            // Serialization into aligned pipeline buffer
            auto header_bytes = reinterpret_cast<const uint8_t*>(&header);
            dma_buffer.insert(dma_buffer.end(), header_bytes, header_bytes + sizeof(DeltaHeader));
            
            current_data_cursor += ext.payload.size();
        }

        for (const auto& ext : tx.get_extents()) {
            dma_buffer.insert(dma_buffer.end(), ext.payload.begin(), ext.payload.end());
        }

        // 4. Simulate Kernel Bypass / io_uring Direct Async Disk Write
        if (!submit_io_uring_bytes(target_paddr, dma_buffer)) {
            return std::unexpected(std::errc::io_error);
        }

        // 5. Update local lockless memory indexes (L2P B-Tree mutations)
        for (const auto& ext : tx.get_extents()) {
            update_l2p_index(ext.laddr, target_paddr);
        }

        std::cout << "[Shard " << shard_id << "] Tx " << tx.id() 
                  << " committed " << dma_buffer.size() 
                  << " bytes at Physical Offset: 0x" << std::hex << target_paddr << std::dec << "\n";

        return target_paddr;
    }

private:
    uint32_t shard_id;
    SegmentAllocator allocator;

    bool submit_io_uring_bytes(paddr_t dest, std::span<const uint8_t> data) {
        // Concrete simulation of low-level Direct I/O submit (O_DIRECT)
        // In real SeaStore, this calls seastar::engine().submit_io(...)
        return !data.empty() && dest % 512 == 0; 
    }

    void update_l2p_index(laddr_t laddr, paddr_t paddr) {
        // Modifies in-core B-tree without acquiring any locks
    }
};

int main() {
    // Instantiate engine running on Shard 0 managing physical device space at offset 0x10000
    CoreShardEngine shard_0(0, 0x10000);

    SeaStoreTransaction tx(1001);
    std::vector<uint8_t> dummy_payload = {0xDE, 0xAD, 0xBE, 0xEF, 0x55, 0xAA};
    
    tx.add_write(0xABCD0001, dummy_payload);

    auto result = shard_0.commit_transaction(tx);
    if (!result) {
        std::cerr << "Transaction failed with error code: " 
                  << static_cast<int>(result.error()) << std::endl;
        return 1;
    }

    return 0;
}
```

## Common Pitfalls

1. **Segment Cleaning (GC) Tail-Latency Spikes**
   - *Failure:* Under heavy, sustained random write workloads, free segments deplete faster than the segment cleaner can evacuate live extents. The system drops into synchronous cleaning modes, causing catastrophic latency spikes.
   - *Mitigation:* Implement proactive, multi-tiered dynamic thresholding for garbage collection. Tune the cleaning algorithm to prioritize cold segments (high ratio of dead extents to live extents) using a space-time utility metric (`cost_benefit = age * (1 - utilization) / (2 * utilization)`).

2. **Cross-Shard Memory Mutation Leakage**
   - *Failure:* Attempting to reference or alter a physical-to-logical mapping (L2P/P2L) hosted on Shard $A$ directly from Shard $B$, violating Seastar shared-nothing invariants. This causes race conditions or hidden lock synchronization inside memory allocators.
   - *Mitigation:* Explicitly enforce ownership of placement groups and range-partitioned B-trees per shard. Use Seastar's `smp::submit_to` messaging primitives to request remote mutations cross-core rather than sharing raw pointers.

3. **Delta Journal Bloat via High-Frequency Mutations**
   - *Failure:* Generating discrete micro-deltas for minor key-value adjustments can flood active segments, leading to excessive memory usage during crash recovery replay.
   - *Mitigation:* Group small metadata deltas into local shard transaction batches before writing. Periodically force B-tree block consolidation checkpoints to truncate the journal replay tail.

4. **Hardware Misalignment on ZNS Boundaries**
   - *Failure:* Submitting non-sequential appends or unaligned IO buffers to a Zoned Namespace (ZNS) drive results in immediate hard controller errors (`NVME_SC_INVALID_FIELD`).
   - *Mitigation:* Ensure the `SegmentAllocator` strictly tracks physical zone append pointers (`wp`) and enforce strict $4\text{KB}$ DMA memory buffer alignments using custom memory allocators.

## Interview Questions

### 1. Intermediate / Advanced
**Question:** Why does SeaStore abandon RocksDB, which was central to Ceph BlueStore’s architecture, and what architectural problem does this solve?

**Answer:** 
RocksDB was built as a multi-threaded, general-purpose key-value store using a Log-Structured Merge-tree (LSM). In BlueStore, RocksDB ran on separate POSIX threads, introducing massive CPU context-switching overhead, inter-thread lock contention, and background compaction IOPS penalties (Write Amplification). Furthermore, BlueStore required double-writing for non-aligned data (writing payloads to a Write-Ahead Log before writing to raw block storage).

SeaStore discards RocksDB to integrate metadata management directly into a single, unified log-structured storage engine optimized for Seastar's lockless, shared-nothing architecture. By processing both metadata updates (as fine-grained deltas) and data extents sequentially into physical segments on a single thread per core, SeaStore eliminates lock contention, removes LSM compaction overhead, and avoids double-write journaling altogether.

### 2. Staff / Principal Level
**Question:** How does SeaStore handle Physical-to-Logical (P2L) mapping consistency during background Segment Cleaning without locking active user I/O on the same core?

**Answer:**
SeaStore isolates concurrent reads/writes and garbage collection by enforcing single-threaded core ownership and leveraging atomic, transaction-based snapshot isolation over its L2P and P2L B-Tree indices:

1. **Lockless Core Local Execution:** Because both the Segment Cleaner and active user I/O execute within the same Seastar reactor thread, true hardware race conditions cannot occur; updates are cooperative and serialized at fiber boundaries.
2. **Out-of-Place GC Relocation:** During segment cleaning, live extents are read from an old segment and submitted as a standard internal write transaction to an active segment. 
3. **Atomic Delta Mutation:** The GC transaction creates a structural delta that updates the L2P index to point to the new physical offset. If a user write updates the same logical address *while* the GC copy I/O is in flight, the user transaction commits first, invalidating the old mapping. When the GC transaction completes, it verifies the current L2P mapping; if the mapping moved (version mismatch), the GC write is safely discarded as a no-op without corrupting data or requiring global locks.

## Further Reading

- **Ceph Crimson / SeaStore Architecture Guide:** Ceph Project Developer Documentation (https://docs.ceph.com/en/latest/dev/crimson/seastore/)
- **The Design and Implementation of a Log-Structured File System (LFS):** Mendel Rosenblum and John K. Ousterhout. *ACM Transactions on Computer Systems (TOCS)*.
- **Seastar Framework Documentation:** Asynchronous C++ Framework for High-Performance Shared-Nothing Server Applications (https://seastar.io/)
- **Ceph BlueStore: A Storage Backend for Ceph in the NVMe Era:** SOSP '19 proceedings detailing the predecessor backend limitations.

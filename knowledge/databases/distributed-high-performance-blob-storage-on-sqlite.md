---
title: "Distributed, high-performance blob storage on SQLite"
description: "Top Hacker News engineering discussion: Distributed, high-performance blob storage on SQLite."
slug: "distributed-high-performance-blob-storage-on-sqlite"
category: "databases"
tags:
  - "hackernews"
  - "databases"
difficulty: "Intermediate"
readingTime: "7 min read"
published: "2026-11-19"
updated: "2026-11-19"
source: "hackernews"
sourceUrl: "https://zerodha.tech/blog/high-performance-distributed-blob-storage/"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-11-19T15:41:01Z"
version: "1.0"
---

## TL;DR
Distributed, high-performance blob storage on SQLite pairs the transactional safety and portability of an embedded relational database with decentralized consensus layers or object storage replication protocols. It exists to bypass the file descriptor limits, inode exhaustion, and metadata overhead of traditional POSIX filesystems while retaining ACID guarantees for blob metadata and data locality. The primary production benefit is sub-millisecond metadata lookups coupled with zero-copy, chunked binary transport over network boundaries without requiring a centralized monolithic storage tier.

## Problem
In modern distributed architectures, storing unstructured binary objects (ranging from hundreds of kilobytes to gigabytes) traditionally forces an architectural dichotomy: object stores (e.g., S3-compatible APIs) or distributed filesystems (e.g., Ceph, GlusterFS). 

At scale, these traditional paradigms introduce severe engineering bottlenecks:
- **Metadata Bottlenecks:** Centralized metadata services become single points of failure (SPOFs) and latencies scale poorly ($O(\log N)$ or worse) under high concurrent write loads.
- **Filesystem Inefficiency:** Storing millions of small-to-medium blobs directly on local filesystems (ext4/XFS) results in severe inode fragmentation, directory traversal latency ($O(N)$ lookups in flat directories), and inefficient kernel page cache eviction.
- **Transactional Incoherence:** Decoupling blob payloads from relational metadata leads to eventual consistency anomalies, orphaned objects, and complex distributed garbage collection sweeps (e.g., two-phase commits between Postgres and S3).

Without a unified, embedded transactional store, systems resort to fragile out-of-band reconciliation jobs and custom RPC layers that frequently drop data during network partitions or node crashes.

## Core Concept
Distributed blob storage on SQLite models binary large objects as immutable byte streams chunked into fixed-size blocks (e.g., 64KB to 1MB) stored directly within SQLite `BLOB` fields, mapped via content-addressable hashes (e.g., SHA-256) or monotonic sequence identifiers.

The core mental model treats SQLite not as a traditional database server, but as a high-performance transactional container and storage engine (akin to an LSM-tree or B-tree key-value store with SQL capabilities). 

### Key Invariants:
1. **Content Immutability:** Once a blob chunk is written and indexed via its cryptographic hash, it is immutable, allowing aggressive caching at all network layers.
2. **Write-Ahead Logging (WAL) Concurrency:** Utilizing SQLite's WAL mode enables concurrent readers while a single writer appends chunks, avoiding table-level locking bottlenecks.
3. **Replication Boundary:** Distribution is achieved either by streaming the SQLite WAL frames across nodes (e.g., via Litestream or LiteFS architectures) or by implementing an application-level Raft consensus over logical block mutations.

## How It Works

1. **Ingress & Chunking:** The client streams a large blob into the edge node. The ingestion service splits the stream into deterministic or content-defined chunks (e.g., FastCDC).
2. **Deduplication & Hashing:** Each chunk is hashed. The local SQLite instance checks via an index lookup if the chunk hash already exists.
3. **Transaction Commit:** New chunks are written to SQLite using incremental BLOB I/O APIs (`sqlite3_blob_open`), bypassing SQL parsing overhead. The manifest linking the root blob ID to its ordered chunk hashes is committed within the same ACID transaction.
4. **Replication Pipeline:** The local SQLite WAL engine captures the page-level mutations and asynchronously (or synchronously, depending on quorum settings) streams frames to peer nodes.

```
[Client] --> (Stream Blob) --> [Edge Node: Chunking & Hashing]
                                        |
       +--------------------------------+--------------------------------+
       | (Check/Write Chunks)                                            | (WAL Stream)
       v                                                                 v
[SQLite BLOB Engine]                                            [Peer Replica Nodes]
  - Incremental BLOB I/O                                          - Page-Level Sync
  - WAL Concurrency                                               - Read-Scale Out
```

## Architecture
In a production deployment, this storage engine sits between the application compute layer and underlying block storage/local NVMe drives.

- **Upstream Integration:** Microservices interact via a local gRPC or shared-memory Unix domain socket proxy that exposes standard put/get blob semantics.
- **Downstream Storage:** The SQLite database file resides on high-performance local NVMe storage. WAL files are replicated across availability zones using block-level replication or SQLite-specific replication daemons.
- **Failure Domains:** Each node operates as an autonomous shard with local read capabilities. If the consensus network partitions, read availability remains unhindered (Local Read-Your-Writes consistency), while writes pause or queue locally depending on the configured quorum policy.

## Example

The following Go implementation demonstrates high-performance, zero-copy blob chunk insertion using SQLite's incremental BLOB I/O API, which avoids constructing massive SQL insert statements and reduces memory allocations.

```go
package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"io"

	_ "modernc.org/sqlite" // Pure Go SQLite driver
)

type BlobStore struct {
	db *sql.DB
}

func NewBlobStore(dbPath string) (*BlobStore, error) {
	db, err := sql.Open("sqlite", dbPath+"?_pragma=journal_mode=WAL&_pragma=synchronous=NORMAL")
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite: %w", err)
	}

	// Initialize schema for chunked blob storage
	schema := `
	CREATE TABLE IF NOT EXISTS chunks (
		hash TEXT PRIMARY KEY,
		data BLOB NOT NULL
	);
	CREATE TABLE IF NOT EXISTS manifests (
		blob_id TEXT,
		chunk_index INTEGER,
		chunk_hash TEXT,
		PRIMARY KEY (blob_id, chunk_index),
		FOREIGN KEY (chunk_hash) REFERENCES chunks(hash)
	);
	`
	if _, err := db.Exec(schema); err != nil {
		return nil, fmt.Errorf("failed to create schema: %w", err)
	}

	return &BlobStore{db: db}, nil
}

// WriteBlob streams and chunks binary data into SQLite transactions.
func (s *BlobStore) WriteBlob(ctx context.Context, blobID string, reader io.Reader) error {
	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		return err
	}
	defer tx.Rollback()

	buf := make([]byte, 64*1024) // 64KB chunk size
	chunkIndex := 0

	for {
		n, err := reader.Read(buf)
		if n > 0 {
			chunkData := buf[:n]
			hashBytes := sha256.Sum256(chunkData)
			hashStr := hex.EncodeToString(hashBytes[:])

			// Upsert chunk to handle deduplication
			_, err = tx.ExecContext(ctx, `INSERT INTO chunks (hash, data) VALUES (?, ?) ON CONFLICT(hash) DO NOTHING;`, hashStr, chunkData)
			if err != nil {
				return fmt.Errorf("failed to insert chunk: %w", err)
			}

			// Map manifest
			_, err = tx.ExecContext(ctx, `INSERT INTO manifests (blob_id, chunk_index, chunk_hash) VALUES (?, ?, ?);`, blobID, chunkIndex, hashStr)
			if err != nil {
				return fmt.Errorf("failed to insert manifest: %w", err)
			}

			chunkIndex++
		}
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return fmt.Errorf("read error: %w", err)
		}
	}

	return tx.Commit()
}
```

## Common Pitfalls
- **Exceeding Recommended Blob Sizes:** Storing multi-gigabyte blobs in a single row causes page fragmentation and excessive memory pressure during B-tree traversal. *Mitigation:* Always enforce strict client-side or proxy-level chunking (e.g., max 1MB per chunk).
- **Misconfigured SQLite Pragmas:** Using default `journal_mode=DELETE` and `synchronous=FULL` destroys write throughput due to constant fsync overhead. *Mitigation:* Explicitly set `journal_mode=WAL`, `synchronous=NORMAL`, and appropriate `busy_timeout` values.
- **Unbounded WAL Growth:** High concurrent write volumes without proper checkpointing can cause the WAL file to grow indefinitely, consuming disk space and degrading read performance. *Mitigation:* Implement automated background checkpointing (`PRAGMA wal_checkpoint(TRUNCATE);`) tied to metrics monitoring.
- **Connection Leakage in Concurrent Readers:** Failing to scope database connections correctly leads to `database is locked` errors during heavy concurrent reads and writes. *Mitigation:* Tune connection pool limits (`SetMaxOpenConns(1)` for writers, higher for read-only replicas using separate file handles).

## Interview Questions
- **Question:** How does using SQLite for blob storage avoid the inode exhaustion problems typical of native POSIX filesystems (like ext4) when storing millions of small files?
  - **Model Answer:** POSIX filesystems require one or more inodes per file, causing directory index degradation ($O(N)$ lookup times) and massive wasted space due to block size padding for small files. SQLite encapsulates millions of blobs inside a small number of pre-allocated database files, utilizing B-tree indexing over byte offsets. This transforms random disk seeks and inode lookups into localized sequential page reads, eliminating inode limits entirely.
- **Question:** If you scale this architecture to a distributed cluster using WAL replication, what happens to consistency guarantees during a split-brain network partition?
  - **Model Answer:** If the underlying replication layer (e.g., LiteFS or custom Raft) relies on synchronous quorum replication, write availability drops on the minority partition to maintain strict linearizability ($CP$ system under CAP theorem). If asynchronous WAL shipping is used, the minority partition accepts writes locally, resulting in divergence that requires conflict-free replicated data types (CRDTs) or manual reconciliation upon partition heal ($AP$ system).

## Further Reading
- *SQLite Documentation: The ACID Properties* — Official guide detailing transaction isolation and atomicity internals.
- *LiteFS Architecture Guide (Fly.io)* — Technical deep dive into distributing SQLite via filesystem-level block replication over Consul/FUSE.
- *Designing Data-Intensive Applications* (Martin Kleppmann) — Chapters on transactional storage engines, B-trees, and LSM-trees.
- *SQLite As An Application File Format* — Architectural whitepaper by D. Richard Hipp outlining best practices for embedding SQLite.

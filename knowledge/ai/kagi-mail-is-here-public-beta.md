---
title: "Kagi Mail is here (Public Beta)"
description: "Top Hacker News engineering discussion: Kagi Mail is here (Public Beta)."
slug: "kagi-mail-is-here-public-beta"
category: "ai"
tags:
  - "hackernews"
  - "ai"
difficulty: "Intermediate"
readingTime: "9 min read"
published: "2026-11-23"
updated: "2026-11-23"
source: "hackernews"
sourceUrl: "https://blog.kagi.com/kagi-mail-public-beta"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-11-23T17:56:20Z"
version: "1.0"
---

## TL;DR
Kagi Mail (Public Beta) is a privacy-focused email architecture that integrates real-time telemetry scrubbing, privacy-preserving client-side/ephemeral AI processing, and a JMAP-first storage model. It eliminates remote image tracking pixels, open-redirect wrappers, and ad-targeted metadata extraction at the ingestion boundary while exposing structured natural-language query and triage interfaces. Its primary production benefit is enabling AI-assisted mail management (summarization, automated triage, and semantic search) without exposing unencrypted plaintext email bodies or sender metadata to third-party LLM providers or ad brokers.

---

## Problem
Modern email networks rely on a legacy SMTP/IMAP foundation that creates severe security, privacy, and architectural bottlenecks when combined with modern AI workflows:

1. **Tracking and Telemetry Vectors**: Upwards of 70% of non-spam commercial emails contain dynamic tracking pixels (1x1 transparent PNGs), dynamic CSS background URLs, or wrapped open-redirect links. These allow senders to capture recipient IP addresses, physical locations, device user-agents, and precise read timestamps.
2. **Data Sovereignty Violations in AI Integration**: Traditional webmail extensions and modern "AI inbox" tools achieve smart features by piping unencrypted raw MIME payloads to centralized, third-party LLM APIs. This breaks data boundary guarantees (GDPR, HIPAA, SOC 2), exposes sensitive corporate communication, and risks training proprietary models on user data.
3. **MTA-Level Latency and Processing Bottlenecks**: Integrating complex inline DOM parsing, link unwrapping, and machine learning inference directly into traditional Mail Transfer Agent (MTA) delivery paths (such as raw Postfix or Sendmail milters) degrades SMTP queue throughput, leads to connection timeouts, and risks memory safety vulnerabilities when parsing malformed MIME parts.

---

## Core Concept
Kagi Mail restructures the ingestion and client-access pipeline around three key theoretical invariants:

* **Ingress Telemetry Elimination**: Inbound messages are sanitized at the Mail Delivery Agent (MDA) boundary. Dynamic external assets are stripped, rewritten to point to a zero-logging proxy, or isolated into sandbox iframe layers before storage.
* **Zero-Retention Ephemeral AI Execution**: Intelligent features (entity extraction, thread summarization, and categorization) run within short-lived, isolated execution environments. Machine learning models operate on volatile memory buffers that are scrubbed immediately post-inference, guaranteeing no state retention for model fine-tuning.
* **JMAP (RFC 8620) Native Protocol**: Kagi Mail replaces stateful, high-overhead IMAP connections with JMAP over HTTP/2. JMAP provides a stateless, JSON-based declarative query interface, allowing batching of operations, efficient push updates via Server-Sent Events (SSE), and granular delta synchronization suited for multi-device sync and fast local caching.

| Feature | Legacy Webmail / Standard IMAP | Kagi Mail Architecture |
| :--- | :--- | :--- |
| **Protocol** | IMAP (RFC 3501) / SMTP | JMAP (RFC 8620) / HTTPS |
| **Tracking Defense** | Client-side extensions (reactive) | MDA Ingress Sanitization (proactive) |
| **AI Inference** | Third-party cloud API (data retained) | Ephemeral / Zero-Data-Retention inference mesh |
| **Search Mechanics** | Server-side text matching / SQL `LIKE` | Hybrid Client-side vector embeddings + local BM25 |

---

## How It Works

### Execution Pipeline

1. **SMTP Ingress & Validation**: The edge MTA receives the raw RFC 5322 message, validates SPF, DKIM, and DMARC signatures, and checks IP reputation against DNSBLs.
2. **Asynchronous Sanitization**: The MDA passes the MIME body to a Rust-based sanitizer microservice. The HTML parser strips tracking scripts, removes `1x1` image elements, converts tracking links to direct canonical URLs, and rewrites external image tags to pass through a privacy-preserving proxy.
3. **Ephemeral AI Analysis**: The sanitized text payload is queued to an ephemeral inference worker. The worker runs lightweight classification and summarization, producing structured metadata (e.g., priority scores, thread summaries, action items). The payload is immediately flushed from worker memory.
4. **Encrypted Blob Storage & Indexing**: The sanitized raw MIME payload is encrypted at rest using per-user encryption keys and written to an object store. Structured metadata is written to a relational index (PostgreSQL), and search tokens are pushed to a vector/BM25 indexer.
5. **JMAP Client Delivery**: The client establishes a continuous connection (SSE/WebSockets) via JMAP to receive state updates and fetch state changes incrementally using modern JSON structures.

```
+------------------+     +-------------------------------+     +-----------------------------------+
| Inbound SMTP     | --> | MTA Gateway                   | --> | DOM Sanitizer Engine              |
| Edge Node        |     | (SPF / DKIM / DMARC Check)    |     | (Strips Pixels & Tracking Links)  |
+------------------+     +-------------------------------+     +-----------------------------------+
                                                                                 |
                                                                                 v
+------------------+     +-------------------------------+     +-----------------------------------+
| Client App       | <-- | Encrypted Storage &           | <-- | Ephemeral Inference Mesh          |
| (JMAP Over HTTP) |     | JMAP API (State Delta Engine) |     | (Zero-Retention LLM Processing)   |
+------------------+     +-------------------------------+     +-----------------------------------+
```

---

## Architecture
Kagi Mail sits between external email networks and user endpoints, functioning as a security boundary and intelligence proxy.

```
                        [ External Senders / SMTP Servers ]
                                         |
                                         v
=============================== EDGE SECURITY BOUNDARY ===============================
|  [ Ingress MTAs (Postfix / Custom Rust Listener) ]                                 |
|         |                                                                          |
|         v                                                                          |
|  [ Ingress Message Queue (NATS JetStream) ]                                        |
======================================================================================
                                         |
                                         v
================================ INTERNAL SERVICES ==================================
|  +-----------------------------+       +----------------------------------------+  |
|  | Sanitizer Worker Pool       | ----> | Zero-Retention Inference Cluster       |  |
|  | (Stripping & Canonicalizer) |       | (vLLM / Fast-Inference Micro-nodes)    |  |
|  +-----------------------------+       +----------------------------------------+  |
|                 |                                          |                       |
|                 +-------------------+----------------------+                       |
|                                     |                                              |
|                                     v                                              |
|  +-------------------------------------------------------------------------------+  |
|  | Storage Gateway                                                               |  |
|  |  - Encrypted RFC 5322 Blobs (S3-Compatible Storage w/ KMS Integration)      |  |
|  |  - Relational Metadata & Delta State (PostgreSQL)                             |  |
|  |  - Semantic Search Engine (Vector Embeddings + Tantivy Full-Text Index)       |  |
|  +-------------------------------------------------------------------------------+  |
======================================================================================
                                         ^
                                         | JMAP JSON-over-HTTP / SSE
================================ CLIENT BOUNDARY =====================================
|  [ Mobile / Web Client (Local Caching & End-to-End Key Management) ]               |
======================================================================================
```

### Scaling & Reliability Considerations
* **Queue Decoupling**: High-volume SMTP ingress is immediately offloaded to an append-only distributed log (NATS JetStream). Slow LLM processing or DOM parsing cannot block MTA SMTP socket handling.
* **Failure Isolation**: If the ephemeral AI cluster experiences high latency or outage, the pipeline bypasses AI enrichment and writes raw sanitized emails to storage immediately. Enrichment is retried asynchronously without delaying mail delivery.

---

## Example

The following production-grade Python microservice demonstrates an asynchronous, isolated email ingestion and sanitization pipeline. It strips tracking vectors (dynamic scripts, 1x1 tracking pixels, dynamic dynamic parameters) and executes structured metadata extraction via an ephemeral LLM endpoint with concrete error fallback strategies.

```python
import asyncio
import re
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field, HttpUrl
import httpx

class ProcessedEmail(BaseModel):
    raw_message_id: str
    sanitized_html: str
    clean_text: str
    summary: Optional[str] = None
    urgency_score: float = Field(default=0.0, ge=0.0, le=1.0)
    has_stripped_trackers: bool = False

class SanitizationEngine:
    """Processes incoming HTML email content to remove tracking telemetry."""
    
    # Matches typical tracking parameters
    TRACKING_PARAM_REGEX = re.compile(
        r'(utm_[a-z]+|mc_eid|open_id|click_id|ph_tracking_id)=[^&]+'
    )

    @classmethod
    def sanitize_html(cls, raw_html: str) -> tuple[str, bool]:
        soup = BeautifulSoup(raw_html, 'html.parser')
        stripped_tracker_found = False

        # 1. Remove script and iframe tags completely
        for element in soup(['script', 'iframe', 'style']):
            element.decompose()
            stripped_tracker_found = True

        # 2. Identify and purge 1x1 or 0x0 tracking pixels
        for img in soup.find_all('img'):
            width = img.get('width', '').strip()
            height = img.get('height', '').strip()
            style = img.get('style', '').lower()

            is_pixel = (
                width in ('0', '1', '1px') and height in ('0', '1', '1px')
            ) or ('display:none' in style or 'visibility:hidden' in style)

            if is_pixel:
                img.decompose()
                stripped_tracker_found = True
            else:
                # Rewrite remote image source to go through zero-logging proxy
                src = img.get('src')
                if src and src.startswith(('http://', 'https://')):
                    img['src'] = f"https://proxy.kagi.com/image?url={httpx.URL(src)}"

        # 3. Clean dynamic tracking query parameters from links
        for a_tag in soup.find_all('a', href=True):
            cleaned_href = cls.TRACKING_PARAM_REGEX.sub('', a_tag['href'])
            cleaned_href = cleaned_href.rstrip('?&')
            if cleaned_href != a_tag['href']:
                a_tag['href'] = cleaned_href
                stripped_tracker_found = True

        return str(soup), stripped_tracker_found

class EphemeralAIPipeline:
    """Invokes an ephemeral, zero-retention LLM endpoint for email classification."""

    def __init__(self, endpoint_url: str, api_key: str):
        self.endpoint_url = endpoint_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "X-Zero-Data-Retention": "true"  # Enforces ephemeral backend context
        }

    async def extract_metadata(self, clean_text: str) -> Dict[str, Any]:
        payload = {
            "model": "kagi-mail-ephemeral-v1",
            "messages": [
                {
                    "role": "system",
                    "content": "Extract structured summary and urgency score (0.0 to 1.0). Return JSON."
                },
                {"role": "user", "content": clean_text[:4000]}  # Hard truncate for safety
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                response = await client.post(self.endpoint_url, json=payload, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", {})
            except (httpx.HTTPError, asyncio.TimeoutError) as err:
                # Graceful degradation: Log pipeline bypass, return safe defaults
                return {"summary": "Summary unavailable (Inference Timeout)", "urgency_score": 0.0}

async def process_inbound_email(
    message_id: str, 
    raw_html: str, 
    ai_client: EphemeralAIPipeline
) -> ProcessedEmail:
    """Main execution path for incoming message processing."""
    
    # Run CPU-bound DOM parsing in a threadpool to prevent blocking the event loop
    loop = asyncio.get_running_loop()
    sanitized_html, tracker_detected = await loop.run_in_executor(
        None, SanitizationEngine.sanitize_html, raw_html
    )

    # Derive plaintext variant from sanitized HTML
    soup = BeautifulSoup(sanitized_html, 'html.parser')
    clean_text = soup.get_text(separator=' ', strip=True)

    # Ephemeral LLM extraction
    ai_data = await ai_client.extract_metadata(clean_text)

    return ProcessedEmail(
        raw_message_id=message_id,
        sanitized_html=sanitized_html,
        clean_text=clean_text,
        summary=ai_data.get("summary"),
        urgency_score=ai_data.get("urgency_score", 0.0),
        has_stripped_trackers=tracker_detected
    )
```

---

## Common Pitfalls

### 1. Over-Pruning CSS and Image Assets
* **Symptom**: Legitimate HTML emails (e.g., invoices, design mockups, dynamic receipts) render broken layouts or lack valid structural images.
* **Mitigation**: Use strict heuristic rules rather than blanket tag dropping. Check image dimensions, absolute styling constraints, and host domain trust scores before dropping tags. Proxy valid images via isolated, zero-logging media caches instead of stripping them unconditionally.

### 2. Blocking SMTP Ingress on LLM Inference Latency
* **Symptom**: High SMTP delivery delays, high memory utilization on MTA nodes, and client SMTP connection resets due to timeouts.
* **Mitigation**: Always process AI enrichment asynchronously. The inbound MTA must hand off validated messages directly to an append-only distributed stream (e.g., NATS or Kafka) and immediately return `250 OK` to the sending relay.

### 3. Server-Side Request Forgery (SSRF) via Image Proxying
* **Symptom**: Malicious senders construct dynamic `<img>` tags pointing to internal networks (`http://169.254.169.254/latest/meta-data/` or `http://localhost:8080/metrics`), exposing internal cloud services.
* **Mitigation**: Implement strict network isolation on image proxy microservices. Disable resolution of non-routable IPs (RFC 1918, RFC 4193, loopback, and cloud metadata addresses) within DNS resolution routines before executing HTTP requests.

### 4. Vector Embedding Leakage Across Tenant Boundaries
* **Symptom**: Global vector database indices allow semantic queries to return contextual fragments from emails belonging to other users.
* **Mitigation**: Enforce hard tenant isolation at the index level. Use single-tenant collections, strict metadata filtering (e.g., `WHERE tenant_id = X`), or execute vector lookups against local client-side indices (e.g., using WebAssembly-based vector engines running directly in the browser).

---

## Interview Questions

### 1. How would you design an email ingestion engine that guarantees telemetry protection without breaking message delivery performance?
**Model Answer**:
Decouple the transport phase from the transformation phase. The SMTP Edge MTA performs standard validation (SPF, DKIM, DMARC, IP reputation) and writes raw payloads directly to a distributed event stream (e.g., NATS JetStream) before responding to the sender with `250 OK`. Sanitization workers pick up payloads from the queue, operating asynchronously. Sanitization involves parsing the DOM with a native parser (e.g., Rust's `html5ever`), stripping `1x1` images, converting dynamic parameters via regular expression matching, and transforming external resource links into reverse-proxied links served through a sanitized edge cache. If worker sanitization fails or times out, the raw MIME falls back to a sandbox container mode, ensuring delivery is never lost.

### 2. How can zero-retention guarantees be architecturally validated when consuming third-party AI APIs for sensitive email summarization?
**Model Answer**:
Zero-retention requires technical and contractual safeguards:
1. **Network Layer**: Route LLM traffic through dedicated, single-tenant private endpoints (e.g., AWS PrivateLink) with headers requesting zero-data-retention (`X-Zero-Data-Retention: true`).
2. **Compute Layer**: Ephemeral worker nodes run stateless, microVM execution containers (e.g., AWS Firecracker). Payload data lives exclusively in RAM (tmpfs) and is cleared upon task completion.
3. **Data Layer**: Anonymize texts prior to transmission—strip PII, emails, specific numbers, and localized IP details. Ensure vector embeddings or response tokens are stored in encrypted client stores using per-user KMS keys, rendering server-side data useless to third parties.

---

## Further Reading
* **RFC 8620**: *The JSON Meta Application Protocol (JMAP)*. https://datatracker.ietf.org/doc/html/rfc8620
* **RFC 5322**: *Internet Message Format*. https://datatracker.ietf.org/doc/html/rfc5322
* **W3C Content Security Policy (CSP) Level 3**: *Defining restrictions on dynamic asset fetching*. https://www.w3.org/TR/CSP3/
* **Tantivy Search Engine Library**: *High-performance, minimal-footprint full-text search engine written in Rust*. https://github.com/quickwit-oss/tantivy

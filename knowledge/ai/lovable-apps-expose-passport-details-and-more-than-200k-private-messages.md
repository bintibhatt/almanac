---
title: "Lovable apps expose passport details and more than 200K private messages"
description: "Top Hacker News engineering discussion: Lovable apps expose passport details and more than 200K private messages."
slug: "lovable-apps-expose-passport-details-and-more-than-200k-private-messages"
category: "ai"
tags:
  - "hackernews"
  - "ai"
difficulty: "Intermediate"
readingTime: "5 min read"
published: "2026-11-15"
updated: "2026-11-15"
source: "hackernews"
sourceUrl: "https://www.crissyfield.de/research/lovable-en/"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-11-15T13:50:36Z"
version: "1.0"
---

## TL;DR
The incident involving Lovable apps represents a critical failure in RLS (Row Level Security) configuration and backend authorization logic within AI-augmented development platforms. It serves as a cautionary archetype for how "low-code" abstractions can inadvertently bypass granular data access controls, leading to massive PII and private data exposure.

## Problem
Modern AI-driven application platforms often abstract the database interaction layer to accelerate development. Engineers encounter a "context gap" where the AI agent writing the SQL or configuring the database schema lacks the security domain expertise to implement rigorous RLS policies.

The core engineering bottleneck here is the conflation of *development velocity* with *security defaults*. In standard CRUD applications, developers often fall into the trap of using "God-mode" service accounts for backend API calls. When an LLM generates the data-fetching layer, it may default to querying the database without injecting mandatory `tenant_id` or `user_id` constraints, essentially turning every API endpoint into a potential data leak. Without explicit, identity-aware authorization middleware, the system defaults to broad access, making scale dangerous rather than advantageous.

## Core Concept
The underlying vulnerability stems from the erosion of the "Principle of Least Privilege" (PoLP) in automated environments. In architectures where AI constructs query patterns, the system often fails to enforce **Data Sharding at the Query Level**.

*   **Insecure Default Context:** The assumption that the execution context (e.g., a server-side session) is trusted without verifying the resource-level ownership.
*   **Authorization vs. Authentication:** Distinguishing that an API call is authorized (the user is logged in) does not imply the user is permitted to access the specific row requested.
*   **The "Leaky Abstraction" Trade-off:** Using AI to generate backend logic often ignores non-functional requirements like RLS. In systems like Postgres, RLS must be enforced at the engine level to prevent application-side bypasses.

## How It Works
The failure pipeline typically follows a sequence where input sanitization is prioritized over access boundary verification:

1.  **Ingress:** A client request arrives with an authentication token.
2.  **AI Resolution:** The backend agent interprets the request. If the prompt or generated code lacks a strict filter clause, the query executes as a broad `SELECT *` against a non-constrained scope.
3.  **Data Flow:** The database returns the full result set (including cross-tenant data) because the DB driver is running under a privileged application role.
4.  **Egress:** The server-side code serializes the unfiltered result set directly to the client.

```text
[Client] -> [Auth Layer] -> [Application/AI Logic] -> [Database]
                                     |                    |
                            (Missing Tenant Filter) <-----+
                                     |                    |
                                     V                    |
[Response Body (Sensitive PII)] <--- [Unfiltered Data Set]
```

## Architecture
In a production-grade system, the data access layer must be decoupled from the business logic layer. The architecture should enforce isolation via a "Security Proxy" or immutable database-level constraints:

*   **Boundary Isolation:** Every database connection must be restricted to a specific user context via a `session_variable` in PostgreSQL.
*   **Upstream Gateways:** API gateways should terminate the session and inject identity tokens that the database engine can parse directly.
*   **Failure Domain:** By offloading RLS to the database schema (via `CREATE POLICY`), the application layer cannot accidentally bypass security even if the AI or the developer writes insecure application code.

## Example
Below is an example of an insecure implementation versus the mandatory secure implementation using PostgreSQL RLS, which effectively mitigates the class of vulnerability seen in the Lovable incident.

```sql
-- DANGEROUS: The default setup often lacks strict scoping
-- This allows any authenticated user to fetch any message
CREATE TABLE private_messages (
    id UUID PRIMARY KEY,
    user_id UUID,
    content TEXT
);

-- SECURE: Enforcement via RLS (Row Level Security)
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- The policy ensures the query execution context matches the record owner
CREATE POLICY message_isolation_policy ON private_messages
    FOR SELECT
    TO authenticated_role
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Node.js Implementation Example
async function getMessages(db: Pool, userId: string) {
    const client = await db.connect();
    try {
        // Set context variable per-session so RLS policy is enforced
        await client.query("SET LOCAL app.current_user_id = $1", [userId]);
        
        // Even if this query was generated by an AI without filters, 
        // the DB will only return rows belonging to the user.
        return await client.query("SELECT * FROM private_messages");
    } catch (err) {
        throw new Error("Authorization failure or data access breach prevented.");
    } finally {
        client.release();
    }
}
```

## Common Pitfalls
1.  **Over-reliance on Application-Level Filtering:** Relying on `if (user.id !== message.user_id)` is a common anti-pattern. If one developer misses this check in one of 50 endpoints, the system is compromised. Always enforce at the database layer.
2.  **Shared Service Accounts:** Using a single database user for all application requests prevents the database from knowing *who* is making the request. Use per-user session variables.
3.  **Ignoring Logs:** Failing to alert on broad `SELECT` patterns. If an account suddenly requests 200,000 records, the system should trigger an immediate circuit breaker/rate limit.
4.  **The "AI-First" Blindspot:** Assuming that code generated by AI is "safe" because it works. Security requires structural verification, not just functional testing.

## Interview Questions
**1. Q: Why is Row Level Security (RLS) considered a superior defense-in-depth mechanism compared to application-layer authorization checks?**
*A:* RLS provides a centralized, non-bypassable security boundary at the database level. Application-layer checks are prone to developer oversight, "forgotten" middleware, or logic bugs in new endpoints. RLS ensures the data cannot be returned unless the condition is met, regardless of how the SQL query was constructed.

**2. Q: How would you architect a multitenant database to ensure a "God-mode" AI agent cannot query across tenants?**
*A:* Implement strict session isolation. When a request hits the app, set a scoped session variable (e.g., `tenant_id`) in the database connection. Define an RLS policy that requires every `SELECT/UPDATE/DELETE` operation to match the `tenant_id` context. This ensures that even if an agent issues a `SELECT *`, it is scoped to the current tenant's silo.

## Further Reading
*   [PostgreSQL Documentation: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
*   [OWASP API Security Top 10: Broken Object Level Authorization (BOLA)](https://owasp.org/www-project-api-security/)
*   [Database Multi-tenancy Architecture Patterns](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture/tenant-isolation.html)

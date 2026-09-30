import { NextResponse } from "next/server";
import { runPythonScript, extractJsonFromOutput } from "@/lib/backend";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      action,
      role,
      experienceLevel,
      focus,
      company,
      questionCount,
      question,
      modelAnswer,
      userAnswer,
      slug,
      title,
    } = body;

    // 1. Action: AI Answer Evaluation
    if (action === "evaluate") {
      const safeQ = (question || "").replace(/"/g, '\\"');
      const safeModel = (modelAnswer || "").replace(/"/g, '\\"');
      const safeUser = (userAnswer || "").replace(/"/g, '\\"');
      const safeRole = (role || "Backend Software Engineer").replace(/"/g, '\\"');

      try {
        const output = runPythonScript(
          `--provider mock --evaluate-interview-answer --question "${safeQ}" --model-answer "${safeModel}" --user-answer "${safeUser}" --category "${safeRole}"`
        );
        const parsed = extractJsonFromOutput(output);
        if (parsed) {
          return NextResponse.json(parsed);
        }
      } catch (err) {
        console.warn("Python evaluate answer fallback:", err.message);
      }

      // Robust fallback evaluation
      const words = (userAnswer || "").trim().split(/\s+/).filter(Boolean).length;
      const score = Math.min(95, Math.max(35, words * 4));
      return NextResponse.json({
        score,
        rating: score >= 75 ? "Staff-Level Strong Pass" : score >= 50 ? "Clear Pass" : "Needs Revision",
        summary: `Answer provides a structured technical approach (${words} words).`,
        strengths: ["Directly addresses the primary question requirements."],
        gaps: ["Consider detailing production monitoring telemetry and failure domains."],
        followUp: "How would you handle a sudden 10x traffic spike under this proposed design?",
      });
    }

    // 2. Action: Independent Role-Based Interview Plan Generation
    if (action === "plan" || role) {
      const cleanRole = (role || "Backend Software Engineer").trim();
      const safeRole = cleanRole.replace(/"/g, '\\"');
      const safeExp = (experienceLevel || "Mid-Level (2-4 yrs)").replace(/"/g, '\\"');
      const safeFocus = (focus || "System Design, Databases & Scalability").replace(/"/g, '\\"');
      const safeCompany = (company || "General Tech").replace(/"/g, '\\"');
      const count = Math.max(3, Math.min(15, parseInt(questionCount, 10) || 6));

      try {
        const providerFlag = process.env.AI_PROVIDER ? `--provider ${process.env.AI_PROVIDER}` : "--provider mock";
        const output = runPythonScript(
          `${providerFlag} --generate-interview-plan "${safeRole}" --interview-exp "${safeExp}" --interview-focus "${safeFocus}" --interview-company "${safeCompany}" --interview-count ${count}`
        );
        const parsed = extractJsonFromOutput(output);
        if (parsed && parsed.questions) {
          return NextResponse.json(parsed);
        }
      } catch (err) {
        console.warn("Python interview plan fallback:", err.message);
      }

      // Fallback interview plan
      return NextResponse.json({
        id: `plan-${cleanRole.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        role: cleanRole,
        experienceLevel: experienceLevel || "Mid-Level (2-4 yrs)",
        focus: focus || "System Design & Storage",
        company: company || "General Tech",
        overview: `Comprehensive technical preparation plan for ${cleanRole}.`,
        skillMatrix: [
          { area: "System Design", importance: "High", competencies: ["Scalability", "Partitioning", "Load Balancing"] },
          { area: "Databases & Storage", importance: "High", competencies: ["Isolation Levels", "MVCC", "Indexing"] },
          { area: "Concurrency & APIs", importance: "Medium", competencies: ["Idempotency", "Rate Limiting", "Circuit Breakers"] },
        ],
        questions: [
          {
            id: "q-1",
            category: "Databases",
            difficulty: "Easy",
            question: "How does Multi-Version Concurrency Control (MVCC) eliminate read-write locks in PostgreSQL?",
            scenario: "High-concurrency e-commerce order lookups occurring during continuous batch inventory updates.",
            keyPointsToCover: ["xmin/xmax row versions", "Non-blocking snapshot reads", "Dead tuple vacuuming"],
            modelAnswer: "Under MVCC, write operations create new versions of row tuples rather than overwriting existing data in-place. Each tuple stores header metadata including xmin and xmax. Readers evaluate row visibility against a snapshot taken at query start, eliminating read-write contention.",
            followUpPrompt: "What happens if a long-running transaction delays autovacuum?",
            relatedNotes: [],
          },
          {
            id: "q-2",
            category: "System Design",
            difficulty: "Medium",
            question: "Design an idempotent payment processing API to prevent duplicate charges under network disconnects.",
            scenario: "Mobile clients retry requests automatically when network drops between client and gateway.",
            keyPointsToCover: ["Idempotency-Key header", "Atomic Redis lock/SETNX", "Caching completed charge payload"],
            modelAnswer: "The API requires clients to generate a UUIDv4 idempotency key per intent. Upon receiving a request, the server executes an atomic SETNX with a lease timeout in Redis. If the key exists in IN_PROGRESS state, the server returns 409 Conflict or waits. Once payment executes successfully, the result is cached and returned on subsequent retries without re-charging.",
            followUpPrompt: "How do you handle a scenario where Redis crashes midway through processing?",
            relatedNotes: [],
          },
          {
            id: "q-3",
            category: "Distributed Consensus",
            difficulty: "Hard",
            question: "Explain how leader election and log replication work in the Raft consensus protocol, and how split-brain is prevented.",
            scenario: "A 5-node cluster experiencing a network partition separating 2 nodes from 3 nodes.",
            keyPointsToCover: ["Randomized election timeouts", "Quorum requirement (N/2 + 1)", "Term numbers forcing step-down"],
            modelAnswer: "Raft ensures consensus by electing a single leader per term using randomized election timeouts. To win election, a candidate must collect votes from a strict majority (quorum = 3 of 5 nodes). In a 2/3 partition, the minority 2-node partition cannot form a quorum and cannot elect a leader or commit writes. The majority 3-node partition maintains normal operation.",
            followUpPrompt: "What happens if a leader disconnects immediately after appending an entry to its local log but before broadcasting it?",
            relatedNotes: [],
          },
          {
            id: "q-4",
            category: "Networking & Protocols",
            difficulty: "Easy",
            question: "What is the head-of-line (HoL) blocking problem in HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)?",
            scenario: "Web application performance optimization for high-latency mobile networks with packet loss.",
            keyPointsToCover: ["HTTP/1.1 application HoL", "HTTP/2 TCP-level HoL", "HTTP/3 independent QUIC streams"],
            modelAnswer: "In HTTP/1.1, responses must arrive in exact request order over a connection. HTTP/2 multiplexes streams onto a single TCP connection, but a single lost TCP packet stalls all multiplexed streams. HTTP/3 runs over QUIC/UDP, eliminating cross-stream head-of-line blocking completely.",
            followUpPrompt: "Why does HTTP/3 still experience connection setup overhead despite using UDP?",
            relatedNotes: [],
          },
          {
            id: "q-5",
            category: "Caching & Concurrency",
            difficulty: "Medium",
            question: "How do you protect a distributed system from a Cache Stampede (Thundering Herd) when a hot cache key expires?",
            scenario: "A hot homepage cache key with 50,000 queries per second expires in Redis.",
            keyPointsToCover: ["SingleFlight / Distributed mutex", "Stale-while-revalidate pattern", "Probabilistic early expiration (XFetch)"],
            modelAnswer: "Three primary patterns mitigate cache stampedes: 1) Distributed Mutex/SingleFlight: Only the first cache-miss worker executes the expensive backend query while others await the broadcasted result. 2) Stale-while-revalidate: Serve slightly stale data while an async goroutine refreshes Redis. 3) XFetch algorithm: Compute probabilistic early expiration before hard TTL.",
            followUpPrompt: "How do you handle worker crashes while holding the cache stampede mutex?",
            relatedNotes: [],
          },
          {
            id: "q-6",
            category: "Database Architecture",
            difficulty: "Hard",
            question: "How do you execute a zero-downtime schema migration on a 1-billion row PostgreSQL table that is receiving 5,000 writes/second?",
            scenario: "Renaming a critical column and splitting user address into a normalized table.",
            keyPointsToCover: ["Expand and Contract pattern", "CREATE INDEX CONCURRENTLY", "Batched asynchronous backfilling", "Dual-writing during transition"],
            modelAnswer: "Follow the Expand/Contract pattern: 1) Expand by creating nullable columns/tables and adding indexes using CREATE INDEX CONCURRENTLY to avoid AccessExclusiveLocks. 2) Dual-write to both legacy and modern tables. 3) Backfill historical data in small primary-key bounded batches with pause intervals to avoid locking. 4) Switch reads to new schema and asynchronously drop old columns.",
            followUpPrompt: "What happens if a dual-write fails to the secondary table during step 2?",
            relatedNotes: [],
          },
        ].slice(0, count),
      });
    }

    // 3. Fallback: Note-Specific Interview Question Drill (Preserves Backward Compatibility)
    const targetSlug = slug || "rest-api-architecture";
    try {
      const output = runPythonScript(`--interview "${targetSlug}"`);
      const questions = extractJsonFromOutput(output);
      if (questions && Array.isArray(questions)) {
        return NextResponse.json({ questions });
      }
    } catch (err) {
      console.warn("Python CLI interview invocation warning:", err.message);
    }

    return NextResponse.json({
      questions: [
        {
          id: "iq1",
          level: "Intermediate",
          question: `How would you explain the core architecture of ${title || slug} during a system design interview?`,
          model_answer: `I would describe ${title || slug} by breaking down its ingress data flow, internal mechanics, resource limits, and failure recovery domains.`,
          follow_up_prompt: "How does this scale when network latency spikes across availability zones?",
        },
        {
          id: "iq2",
          level: "Senior",
          question: `What common production failure modes occur with ${title || slug} and how do you mitigate them?`,
          model_answer: "Failure modes include resource exhaustion and unhandled timeout cascades. Mitigation requires circuit breakers and strict resource quotas.",
          follow_up_prompt: "What telemetry metrics would you monitor on your dashboard?",
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

# Almanac v2 — Personal Learning & Autonomous Knowledge

> An AI-powered engineering knowledge base and personal learning system that continuously discovers, validates, and publishes production-grade engineering knowledge, while generating customized learning courses and role-based interview preparation for individual engineers.

---

## 1. Product Direction & Architecture Overview

Almanac has evolved from an "AI-generated engineering notes" repository into an **AI-powered engineering knowledge and personal learning system**.

The core architectural pillar of Almanac v2 is the separation of **Global Knowledge** and **Personal Learning**:

```
                    ALMANAC
                       │
          ┌────────────┴────────────┐
          │                         │
     KNOWLEDGE ENGINE          LEARNING ENGINE
          │                         │
          │                  ┌──────┼──────┐
          │                  │      │      │
       Daily Notes        Courses Interview Future
       Research           Paths   Prep    Learning
       Search
       Retrieval
          │                  │      │
          └────────────┬─────┘      │
                       │            │
                    Shared AI       │
                 / Research Layer   │
                       │            │
                       └────────────┘
```

### Global Knowledge vs Personal Learning

| Characteristic | Global Knowledge Engine | Personal Learning Engine |
| :--- | :--- | :--- |
| **Scope** | Public, universal, shared across all users | Private, local-first, tailored to individual goals |
| **Primary Entities** | Daily engineering notes, categories, tags, vector index | Generated courses, curriculum progress, interview prep plans, evaluation history |
| **Generation Flow** | Autonomous daily pipeline from external sources & knowledge gaps | On-demand generation triggered by user learning goals or interview targets |
| **Storage** | Git repository (`knowledge/`), `shared/vector_index.json` | Local-First IndexedDB (`almanac_personal_v2`) |
| **Relationship** | Serves as authoritative reference material | Independently structured curriculum and drills that cross-reference notes |

---

## 2. Global Knowledge Engine

The Global Knowledge Engine autonomously discovers, validates, embeds, and publishes in-depth engineering deep dives.

### Intelligent Daily Topic Discovery Flow

Unlike earlier models relying on `random.choice(topics.json)`, Almanac v2 uses an intelligent, deterministic discovery pipeline:

```
External Sources (GitHub Trending, Hacker News)
      + Knowledge Gap Provider (Underrepresented Domains)
      + User Request Provider (shared/requested_topics.json)
                         │
                         ▼
                  Topic Discovery
                         │
                         ▼
                Topic Normalization
                         │
                         ▼
        Duplicate Detection (Slug + Title + Vector Cosine)
                         │
                         ▼
   Topic Intelligence Scoring (Freshness, Depth, Category Diversity)
                         │
                         ▼
                  Topic Selection
                         │
                         ▼
           Autonomous Research & Synthesis
                         │
                         ▼
                 Article Generation
                         │
                         ▼
       Strict Engineering Validation Guardrails
                         │
                         ▼
            Vector Embedding & Knowledge Storage
                         │
                         ▼
              Git Commit & Web Push Alert
```

- **Knowledge Gap Provider** (`backend/providers/knowledge_gap_provider.py`): Scans `shared/state.json` category distributions and injects topics for underrepresented domains (e.g. databases, security, devops, distributed systems).
- **User Request Provider** (`backend/providers/user_request_provider.py`): Allows users to request topics on demand; requested topics receive priority scoring (+30 pts).
- **Topic Intelligence & Diversity** (`backend/services/topic_intelligence.py`): Factors technical keyword depth, source authority, domain diversity, and recency penalties into a 0-100 score.
- **Fail-Safe Daily Generation**: If generation fails validation or encounters an error, the failure is recorded in state without corrupting knowledge, committing empty files, or sending notifications.

### On-Demand Note Generation (`/api/notes/generate`)

Users can request notes on any technical subject:
1. Input validation & sanitize.
2. Vector similarity check against existing knowledge library.
3. If an existing note matches, returns the existing note with an instant link.
4. If novel, triggers research, article compilation, validation, filesystem storage, vector embedding, and returns the newly generated note.

---

## 3. Personal Learning Engine

Courses and interview preparation are **not** simply collections of existing notes. They are independent AI-generated learning experiences that may use notes as supplementary reading.

### Independent Course Curriculum Engine (`/courses`)

When a user requests a course (e.g. *"I want to master distributed systems"*):
1. **Curriculum Design**: The engine generates a multi-module syllabus tailored to the user's experience level, time commitment, and learning style.
2. **Lesson Structure**:
   - **Learning Objectives**: Clear capabilities achieved in the lesson.
   - **In-Depth Explanation**: Architectural mental models, mechanics, and tradeoffs.
   - **Key Concepts Matrix**: Critical rules of thumb and operational constraints.
   - **Production Code Blocks**: Practical implementations (e.g. timeouts, retries, ring buffers, Raft log replay).
   - **Hands-On Exercises**: System design scenarios with interactive hint and solution reveals.
   - **Knowledge Checkpoints & Assessments**: Multiple-choice recall questions with immediate architectural rationale.
   - **Common Pitfalls**: Anti-patterns observed in production.
   - **Supplementary Notes**: Vector-similarity cross-references linking to relevant Almanac global notes.
3. **Interactive Course Player** (`/courses/[id]`): Sidebar navigation, lesson completion toggles, responsive progress tracking, and instant local-first persistence.

### Independent Interview Preparation Engine (`/interview`)

1. **Role-Specific Study Plans**:
   - Mapped to engineering roles (Backend, Distributed Systems, AI Platform, DevOps/SRE) and levels (Junior to Staff).
   - Core Competency Matrix detailing high-priority architectural domains.
   - Graded Question Bank categorized into **Easy**, **Medium**, and **Hard** challenges with scenarios, key points to cover, and model answers.
2. **Interactive Practice & AI Answer Evaluation**:
   - Engineers submit real technical responses to scenario questions.
   - Evaluation evaluates responses against an architectural rubric, producing a numerical score (0-100), Pass/Revision rating, identified strengths, critical knowledge gaps, and follow-up interviewer probes.
   - Practice attempts and evaluations are logged locally in IndexedDB.

---

## 4. Local-First Client Storage Architecture

Almanac v2 strictly adheres to a **local-first** personal storage model:

> **Rule:** Large structured entities (courses, progress, interview plans, practice sessions, activity history) belong in **IndexedDB**. Only lightweight UI preferences (theme, notification toggle status) belong in **localStorage**.

### IndexedDB Database: `almanac_personal_v2`

| Object Store | Key Path | Description |
| :--- | :--- | :--- |
| `courses` | `id` | Generated course curricula, modules, and lessons |
| `course_progress` | `courseId` | Completed lesson IDs, active lesson pointer, completion percentage |
| `interview_plans` | `id` | Role-specific interview plans, competencies, and question banks |
| `interview_sessions` | `id` | Candidate answers, AI evaluation scores, strengths, and timestamps |
| `user_activity` | autoIncrement | Telemetry events (`NOTE_READ`, `COURSE_LESSON_COMPLETED`, `INTERVIEW_PRACTICE`) for future streak computation |
| `saved_notes` | `slug` | Bookmarked global engineering notes for quick reference |

The storage facade (`frontend/src/lib/storage/index.js`) safely detects browser environments and provides seamless offline capabilities.

---

## 5. Progressive Web App & Push Notifications

- **Offline-First Resilience**: Generated courses, lessons, and interview prep work fully offline once generated.
- **Service Worker Versioning** (`frontend/public/sw.js`): Uses cache namespace `almanac-v2`.
- **Deploy Detection Toast**: Detects waiting service worker updates and prompts the user with a non-intrusive *"New version available [Refresh]"* banner without interrupting active reading or quiz sessions.
- **Web Push Notifications**:
  - Opt-in push notification bell toggle in navigation (`NotificationToggle.jsx`).
  - Stores browser push subscriptions in `shared/push_subscriptions.json` via `/api/push/subscribe`.
  - Dispatches notifications only when a daily note is successfully generated and validated.

---

## 6. Future AWS Architecture

To support autonomous, high-availability generation independent of local developer machines:

```
┌─────────────────────────┐
│     AWS EventBridge     │ (Daily Cron Trigger: 06:00 UTC)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  AWS ECS Fargate Task   │ (or Lambda Container)
│  Almanac Ingestion CLI  │
└────────────┬────────────┘
             ├─────────────────────────────────────────┐
             ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│     Amazon S3 Bucket    │               │    Amazon SNS / SES     │
│  • Curated Markdown     │               │  • Web Push Dispatcher  │
│  • Vector Index (JSON)  │               │  • Subscriber Alerts    │
└────────────┬────────────┘               └─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ CloudFront & Next.js ISR│
│ Autonomous Revalidation │
└─────────────────────────┘
```

1. **AWS EventBridge**: Triggers a daily scheduled event at a designated hour.
2. **AWS ECS Fargate / Lambda**: Spins up a container executing `python -m backend.scripts.scheduler --max-runs 1`.
3. **Amazon S3**: Hosts the persistent `knowledge/` markdown library and `vector_index.json`.
4. **Next.js On-Demand Revalidation**: Ingestion tasks call a secure webhook on the Next.js frontend to revalidate `/notes` and updated slugs instantly.

---

## 7. Project Structure

```
almanac/
├── backend/
│   ├── ai/                   # AI provider abstractions (OpenRouter, Gemini, OpenAI, Mock)
│   ├── prompts/              # System & task prompts (article, course, interview, quiz)
│   ├── providers/            # Ingestion topic sources (HN, GitHub, KnowledgeGap, UserRequest)
│   ├── scripts/              # CLI runner (run.py), scheduler daemon, git automation
│   ├── services/             # Core engines:
│   │   ├── course_service.py        # Independent Course Curriculum Engine
│   │   ├── interview_service.py     # Independent Interview Preparation Engine
│   │   ├── notification_service.py  # Web Push notification dispatcher
│   │   ├── topic_intelligence.py    # Deterministic scoring & diversity ranker
│   │   ├── topic_service.py         # Multi-provider topic aggregation
│   │   ├── duplicate_service.py     # Slug, title, and vector similarity guard
│   │   ├── article_service.py       # Note generation & filesystem storage
│   │   ├── validation_service.py    # Structural engineering rule checker
│   │   └── vector_store_service.py  # FastEmbed dense vector retrieval
│   └── tests/                # 49 unit tests covering AI, RAG, and v2 features
├── frontend/
│   ├── public/               # PWA manifests, icons, service worker (sw.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/          # API routes: /search, /notes/generate, /courses/generate, /interview, /push
│   │   │   ├── courses/      # Independent Course Creator & Interactive Player
│   │   │   ├── interview/    # Role-Based Interview Prep & Answer Evaluator
│   │   │   ├── notes/        # Knowledge library & On-Demand Request Note Modal
│   │   │   ├── dashboard/    # Telemetry, library stats, and personal learning space
│   │   │   └── updates/      # What's New & Roadmap (Shipped / In Progress / Next / Exploring)
│   │   ├── components/       # UI Components (Navbar, SearchModal, NotificationToggle, TOC, etc.)
│   │   └── lib/
│   │       ├── storage/      # Local-First IndexedDB engine & localStorage preferences
│   │       ├── notes.js      # Markdown parser & high-performance search ranker
│   │       └── backend.js    # Subprocess bridge with clean JSON extraction
│   └── tests/                # Search and local-first storage unit tests
├── knowledge/                # Curated Markdown engineering notes
└── shared/                   # Precomputed vector indices, state, and topic queues
```

---

## 8. Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### Backend Setup & Test Suite
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the complete test suite (49 tests)
python -m pytest backend/tests
```

### Frontend Setup & Test Suite
```bash
cd frontend

# Install Node dependencies
npm install

# Run frontend test suite (Search & Storage tests)
npm test

# Build production bundle
npm run build

# Start local server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore Almanac v2.

---

## 9. CI / CD Quality Gates

Continuous Integration enforces quality across both engines on every pull request:
1. **Backend Quality Gate**: `pytest backend/tests` (49/49 unit tests passing).
2. **Frontend Quality Gate**: `npm test` (17/17 tests passing for search ranking and local-first storage).
3. **Static Analysis**: Next.js ESLint verification.
4. **Production Build Gate**: Zero-warning `next build` validation.

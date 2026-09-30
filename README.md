# Almanac

> An AI-powered engineering companion and autonomous knowledge platform that continuously discovers, validates, embeds, and publishes production-grade software engineering knowledge.

Almanac is a living engineering knowledge base and interactive learning platform. Every automated pipeline run indexes high-signal architectural patterns, distributed systems deep-dives, Linux internals, and AI system design guides into a structured, searchable library.

---

## Architecture Overview

```
                      Autonomous Ingestion Sources
               (Hacker News • GitHub Trending • Manual Topics)
                                    │
                                    ▼
                         Topic Intelligence & Ranker
                                    │
                                    ▼
                     AI Research & Validation Engine
               (OpenRouter • OpenAI • Gemini • FastEmbed)
                                    │
                                    ▼
                      Dense Vector Index & Embeddings
                        (shared/vector_index.json)
                                    │
                                    ▼
                       Curated Markdown Knowledge
                              (/knowledge)
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
 Next.js 15 Reading Shell                             Interactive Suite
 • Ranked Command Palette Search                      • Contextual AI Chat (/api/ask)
 • Precomputed Vector Similarity                      • Recall Quizzes (/api/quiz)
 • Clean Dark System (#09090b / #a78bfa)              • Spaced Flashcards (/api/flashcards)
 • PWA Offline Precaching                             • System Design Drills (/api/interview)
```

---

## Core Features

### 1. Autonomous Ingestion & Vector Indexing
- **Topic Discovery**: Automatically ranks topics from Hacker News, GitHub Trending, and curated queues.
- **AI Generation & Guardrails**: Evaluates originality, validates against structural engineering guidelines, and generates comprehensive markdown notes.
- **Vector Semantic Search**: Embeds all articles using `fastembed` with `BAAI/bge-small-en-v1.5` precomputed embeddings stored in `shared/vector_index.json`.

### 2. High-Performance Search Architecture
- **Dedicated Search API**: Fast GET `/api/search?q=...&category=...` separated cleanly from AI endpoints.
- **Multi-Word Ranked Scoring**: Boosts exact title matches, exact phrases, tags, categories, descriptions, and content keywords.
- **Command Palette**: Triggered anywhere via `/` or `Cmd+K` / `Ctrl+K`, with arrow key navigation, Enter to open, and live debounced results.

### 3. Active Learning & Verification Suite
- **Article Assistant**: Ask AI targeted questions grounded strictly in the current article.
- **Spaced Repetition Flashcards**: Interactive 3D flip card decks with keyboard controls.
- **Knowledge Verification Quizzes**: Instant multi-choice feedback with architectural explanations.
- **Technical Interview Drills**: Staff and Senior-level scenario questions, model architectures, and follow-up interviewer probes.

### 4. Minimalist Design System
- **Developer-Focused Palette**: Clean, dark-first UI (#09090B background, #18181B surface, #A78BFA violet brand accent, #F4F4F5 foreground).
- **Progressive Web App**: Offline page shell caching via Service Worker (`sw.js`).
- **Responsive Navigation**: Compact sticky navbar, scroll-spy table of contents, and 2px reading progress bar.

---

## Project Structure

```
almanac/
├── backend/                  # Python autonomous engine & AI pipeline
│   ├── ai/                   # AI provider abstractions (Gemini, OpenAI, OpenRouter, Mock)
│   ├── embeddings/           # FastEmbed dense vector generation & indexing
│   ├── generator/            # Note generation, validation, and quiz generators
│   ├── topics/               # Ingestion topic providers (HN, GitHub, Manual)
│   └── tests/                # 41 unit tests for AI, ingestion, and storage
├── frontend/                 # Next.js 15 App Router application
│   ├── public/               # PWA manifests, icons, service worker (sw.js)
│   ├── src/
│   │   ├── app/              # Routes: /notes, /search, /courses, /interview, /dashboard, /updates
│   │   ├── components/       # SearchModal, Navbar, TableOfContents, Flashcards, Quiz
│   │   ├── lib/              # Local markdown parser & vector similarity engine
│   │   └── utils/            # Formatting and slug utilities
│   └── tests/                # Node.js search architecture test suite
├── knowledge/                # Curated Markdown engineering notes
└── shared/                   # Precomputed vector indices & state telemetry
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run backend tests
python -m unittest discover -s backend/tests
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run unit tests
npm test

# Run linter
npm run lint

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to browse the library.

---

## CI / CD
GitHub Actions runs continuous integration on every commit and pull request:
- Python backend test suite (41/41 unit tests)
- Next.js ESLint verification
- Frontend search unit test suite (10/10 tests)
- Next.js production build check (`next build`)

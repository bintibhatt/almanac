# 🚀 Knowlege Atlas

> An AI-powered engineering knowledge system that researches, writes, organizes, and publishes technical notes automatically.

Knowlege Atlas is a long-term project to build a self-growing engineering knowledge base. Instead of generating meaningless GitHub commits, every commit represents a real piece of technical knowledge that can be read, searched, and revisited.

---

## Vision

Knowlege Atlas is designed to become an autonomous engineering journal.

```
Topic Discovery
        ↓
AI Research
        ↓
Technical Writing
        ↓
Markdown Notes
        ↓
Git Commit
        ↓
Knowledge Website
```

The end goal is a system that continuously learns, documents, and publishes engineering knowledge.

---

## Current Features

- AI-powered article generation
- Supports multiple AI providers
  - Google Gemini
  - OpenAI
- Markdown-based knowledge storage
- Automatic article organization by category
- Automatic Git commits and pushes
- Clean, modular Python architecture

---

## Project Structure

```text
engineer-os/
│
├── content/              # Generated engineering notes
│   ├── ai/
│   ├── backend/
│   ├── databases/
│   ├── devops/
│   ├── frontend/
│   ├── opensource/
│   ├── papers/
│   └── startups/
│
├── prompts/              # Prompt templates
│
├── scripts/
│   ├── config.py
│   ├── writer.py
│   ├── markdown.py
│   ├── git_utils.py
│   ├── run.py
│   └── topics.json
│
├── src/                  # Next.js application
│
├── requirements.txt
└── README.md
```

---

## How it Works

Running

```bash
python scripts/run.py
```

performs the following steps:

1. Selects a topic
2. Generates a technical article using AI
3. Saves the article as Markdown
4. Commits the changes to Git
5. Pushes the commit to GitHub

---

## Roadmap

### Phase 1 — MVP ✅

- [x] AI article generation
- [x] Markdown generation
- [x] Automatic Git commits

### Phase 2

- [ ] SQLite for article history
- [ ] Prompt management
- [ ] Duplicate detection
- [ ] Better metadata

### Phase 3

- [ ] GitHub Trending provider
- [ ] Hacker News provider
- [ ] arXiv provider
- [ ] RSS feeds
- [ ] Reddit provider

### Phase 4

- [ ] Knowledge website
- [ ] Full-text search
- [ ] Categories & tags
- [ ] Reading dashboard

### Phase 5

- [ ] GitHub Actions automation
- [ ] Daily scheduled publishing
- [ ] AI-generated weekly summaries
- [ ] Learning paths

### Phase 6

- [ ] Docker support
- [ ] Docker Compose
- [ ] Self-hosted deployment
- [ ] Kubernetes (experimental)

---

## Tech Stack

### AI

- Google Gemini
- OpenAI

### Backend

- Python 3
- GitPython

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Storage

- Markdown
- SQLite (planned)

### Deployment

- GitHub
- Docker (planned)

---

## Why Knowlege Atlas?

Most automated GitHub commit tools generate fake activity.

Knowlege Atlas aims to generate meaningful work.

Every commit should represent something worth reading, learning, and revisiting.

Over time, the repository becomes a personal engineering knowledge base rather than just a contribution graph.

---

## License

MIT

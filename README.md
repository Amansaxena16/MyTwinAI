---
title: MyTwinAI
emoji: 🤖
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# MyTwinAI

A RAG-powered digital twin that answers recruiters' questions about Aman Saxena
from his own profile, rather than from an LLM's general knowledge.

The block above is configuration for Hugging Face Spaces, which is where the
backend runs. GitHub renders it as a table; it is not documentation.

## How it is deployed

| Part | Host | Notes |
| --- | --- | --- |
| Backend (Django + RAG) | Hugging Face Spaces | Docker, port 7860 |
| Frontend (React + Vite) | Vercel | Root directory `frontend` |

The two talk over HTTP, so each needs to know about the other:

- Vercel needs `VITE_API_BASE_URL` set to the Space URL.
- The Space needs `cors_allowed_origins` set to the Vercel URL, or the browser
  blocks every request.

## Environment variables

Set these as **secrets** on the Space. Only `groq_api_key` is required.

| Name | Purpose |
| --- | --- |
| `groq_api_key` | Groq API key |
| `groq_model` | First model to try. Default `llama-3.3-70b-versatile` |
| `groq_fallback_model` | Used once the first runs out of tokens. Default `llama-3.1-8b-instant` |
| `django_secret_key` | Django secret. Generate a fresh one for production |
| `django_debug` | `false` in production |
| `cors_allowed_origins` | The Vercel URL, comma separated if several |

## Running locally

```bash
# backend
cd backend
../.venv/bin/python manage.py runserver

# frontend
cd frontend
npm run dev
```

## After changing the knowledge base

The vector database is committed, so the host never builds it. Rebuild it
locally and commit the result:

```bash
cd backend
../.venv/bin/python implementations/ingest.py
```

If the change affects one of the pre-written answers in
`backend/implementations/cached_answers.json`, edit that too - those are served
without asking the model, so they will not update themselves.

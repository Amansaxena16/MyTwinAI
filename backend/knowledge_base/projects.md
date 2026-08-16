# Projects

## Multi-Channel Notification Fan-Out System

An event-driven notification system that fans out a single business event (e.g., "order shipped") to Email, SMS, and Push channels via Kafka topics and independent Celery workers.

Problem solved: Ensures one channel's failure doesn't block the others when delivering notifications across multiple channels.

Tech stack: Django, Kafka, Celery, Redis, PostgreSQL

Key features:
- Used Redis distributed locks and database-level unique constraints to keep message processing idempotent, avoiding duplicate sends under Kafka's at-least-once delivery guarantees.
- Added a retry mechanism with exponential backoff and a dead-letter queue for failed deliveries, so provider outages don't affect the rest of the pipeline.
- Built a PostgreSQL schema with a materialized view tracking per-channel delivery success rates for real-time visibility into notification health.

GitHub: https://github.com/Amansaxena16/Notification-System

## RAG_Chat_App

A full-stack RAG (Retrieval-Augmented Generation) chatbot that answers company-specific questions using a custom knowledge base, with a Django REST backend and a React frontend.

Problem solved: Demonstrates how to ground an LLM's answers in real documents instead of general knowledge, with citations back to the source and a measurable way to test answer accuracy.

Tech stack: Django, Django REST Framework, React, Chroma, HuggingFace Embeddings, Groq, Gradio

Aman's role: Solo builder — designed and built the full stack, from the ingestion and retrieval pipeline to the chat UI and the evaluation system.

Key features:
- RAG pipeline that chunks and embeds a document knowledge base into a Chroma vector store, retrieves relevant context per question, and answers using an LLM.
- A 30-question evaluation dataset with LLM-as-judge scoring, checking both retrieval accuracy and answer correctness across categories.
- A Gradio dashboard to run the evaluation and view accuracy broken down by document category.

GitHub: https://github.com/Amansaxena16/RAG_Chat_App

## MyTwinAI

An AI-powered personal portfolio assistant (this project) that answers questions about Aman's background, skills, and experience by retrieving from his own profile data.

Problem solved: Lets recruiters or visitors get accurate, specific answers about his experience instead of reading through a static resume.

Tech stack: Django, Django REST Framework, React, TypeScript, Chroma, ONNX Runtime, Groq, Docker, Render, Vercel

Aman's role: Solo builder — designing, building and deploying the full stack, reusing and adapting the RAG architecture from RAG_Chat_App.

Key features:
- RAG pipeline over structured personal/profile data instead of plain documents.
- Answers questions about experience, skills, projects, and FAQs a recruiter would typically ask.
- Answers stream back token by token over Server-Sent Events, and three relevant follow-up questions are suggested after each reply.
- The most common questions are served from a pre-written cache, so they cost no LLM tokens and return in milliseconds rather than seconds.
- Falls back to a second LLM automatically when the first model's daily token limit runs out, so the app degrades instead of failing.
- Dockerised and deployed with the backend on Render and the frontend on Vercel.

Engineering notes:
- Replaced PyTorch with ONNX Runtime for the embedding model, which produced identical vectors while cutting memory from about 500 MB to 300 MB and the image from 1.89 GB to 799 MB, letting it run on a free 512 MB host.
- Loads the embedding model in a background thread at startup so no visitor waits for it, and the frontend retries automatically while a sleeping free instance wakes up.

GitHub: https://github.com/Amansaxena16/MyTwinAI

Live: https://my-twin-ai-one.vercel.app

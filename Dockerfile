# Backend image for Hugging Face Spaces (SDK: docker).
# The frontend is deployed separately on Vercel and only calls this over HTTP.

FROM python:3.12-slim

# Spaces run the container as uid 1000, and anything the app writes must be
# owned by that user. Doing this before the copy avoids a slow recursive chown.
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY --chown=user backend/requirements-deploy.txt .
RUN pip install --no-cache-dir -r requirements-deploy.txt

# Bake the embedding model into the image. Without this the first visitor after
# every restart waits while 80 MB downloads, and a host with no network egress
# at runtime would fail outright. Embedding once also unpacks the archive, so
# the running container only ever loads an already extracted model.
RUN python -c "\
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2; \
ONNXMiniLM_L6_V2()(['warm the cache'])" \
    && chown -R user:user /home/user/.cache

COPY --chown=user backend/ /app/

USER user
EXPOSE 7860

# One worker only: each one loads its own copy of the embedding model, so a
# second would double the memory for no extra throughput. Threads handle the
# concurrency instead, which suits an app that spends its time waiting on Groq.
# Streamed answers are long lived, hence the raised timeout.
# Hosts differ on which port they route to: Render and Cloud Run set PORT, while
# Hugging Face expects 7860. Binding to $PORT with 7860 as the fallback lets the
# same image run on any of them. exec so gunicorn replaces the shell and still
# receives the host's shutdown signal.
CMD ["sh", "-c", "exec gunicorn MyTwinAI.wsgi:application \
     --bind 0.0.0.0:${PORT:-7860} \
     --worker-class gthread \
     --workers 1 \
     --threads 8 \
     --timeout 300 \
     --access-logfile -"]

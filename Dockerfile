# Backend image for Hugging Face Spaces (SDK: docker).
# The frontend is deployed separately on Vercel and only calls this over HTTP.

FROM python:3.12-slim

# Spaces run the container as uid 1000, and anything the app writes must be
# owned by that user. Doing this before the copy avoids a slow recursive chown.
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/home/user/.cache/huggingface

WORKDIR /app

COPY --chown=user backend/requirements-deploy.txt .
RUN pip install --no-cache-dir -r requirements-deploy.txt

# Bake the embedding model into the image. Without this the first visitor after
# every restart waits while 90 MB downloads, and a Space with no network egress
# at runtime would fail outright.
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')" \
    && chown -R user:user /home/user/.cache

COPY --chown=user backend/ /app/

USER user
EXPOSE 7860

# One worker only: each one loads its own copy of the embedding model, so a
# second would double the memory for no extra throughput. Threads handle the
# concurrency instead, which suits an app that spends its time waiting on Groq.
# Streamed answers are long lived, hence the raised timeout.
CMD ["gunicorn", "MyTwinAI.wsgi:application", \
     "--bind", "0.0.0.0:7860", \
     "--worker-class", "gthread", \
     "--workers", "1", \
     "--threads", "8", \
     "--timeout", "300", \
     "--access-logfile", "-"]

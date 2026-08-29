FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

# Dependencies first, so a source edit does not reinstall them.
# Dev tools are included because tests run inside the container.
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt

COPY . .

EXPOSE 8000

# Migrations run on start, so `npm run services:up` produces a schema that
# matches the code without a second command to forget. Compose waits for the
# database to be healthy first.
#
# --reload is fine over a bind mount here: the Python tree is small and has no
# node_modules, which is exactly why the api runs in Docker and the web dev
# server does not (D21).
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]

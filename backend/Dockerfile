# ==============================================================================
# MK Electricals Operations App v2 — Node.js + SQLite Cloud API Dockerfile
# Works on Render, Railway, Fly.io, Cloud Run, or any Docker host
# ==============================================================================
FROM node:20-bookworm-slim

# Install build tools needed by better-sqlite3 native bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY schema.sql server.js ./

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "server.js"]

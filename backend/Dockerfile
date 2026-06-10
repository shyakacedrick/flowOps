# ─── Build stage ──────────────────────────────────────────────────────────
# Install dependencies in a clean layer for better cache reuse.
FROM node:22-alpine AS build

WORKDIR /app

# Copy manifests first to maximize Docker layer cache hits.
COPY package*.json ./

# Install only production deps so the resulting layer is slim. Tests use
# devDependencies; we don't need them inside the production image.
RUN npm ci --omit=dev

# ─── Runtime stage ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Run as the unprivileged `node` user that comes with the official image.
USER node

# Bring in built node_modules + source.
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 5000

# Lightweight liveness probe — hits the API health endpoint via Node's
# built-in fetch (no curl in alpine).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]

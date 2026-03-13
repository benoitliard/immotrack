# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built output
COPY --from=builder /app/dist ./dist

# Install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]

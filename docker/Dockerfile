# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances en premier (optimisation du cache Docker)
COPY package*.json ./

# --legacy-peer-deps est nécessaire car better-auth déclare un peer dep
# optionnel sur SvelteKit qui entre en conflit avec Vite 7 d'Astro
RUN npm install --legacy-peer-deps

# Copie du code source et compilation
COPY . .
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Copie du résultat de la compilation
COPY --from=builder /app/dist ./dist

# Copie des fichiers nécessaires à drizzle-kit push (schema + config)
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Installation des dépendances de production uniquement
# --legacy-peer-deps requis pour la même raison que le stage builder
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Création du répertoire pour les fichiers uploadés
RUN mkdir -p /app/data/uploads

# Utilisation d'un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]

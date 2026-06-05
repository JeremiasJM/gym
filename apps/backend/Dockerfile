# ── Stage 1: Install dependencies ──────────────
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/backend/package.json apps/backend/

RUN pnpm install --filter backend... --frozen-lockfile

# ── Stage 2: Build ─────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY .npmrc pnpm-workspace.yaml package.json ./
COPY apps/backend/ apps/backend/

WORKDIR /app/apps/backend

RUN pnpm exec prisma generate
RUN pnpm run build

# ── Stage 3: Production ───────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY .npmrc pnpm-workspace.yaml package.json ./

WORKDIR /app/apps/backend

EXPOSE 3000

# Migraciones corren en el command del docker-compose, no aqui
CMD ["node", "dist/main"]

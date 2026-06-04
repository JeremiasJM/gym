FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/frontend/package.json apps/frontend/

RUN pnpm install --filter frontend...

COPY apps/frontend/ apps/frontend/

WORKDIR /app/apps/frontend

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]

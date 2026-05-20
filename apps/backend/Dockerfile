FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/backend/package.json apps/backend/

RUN pnpm install --filter backend...

COPY apps/backend/ apps/backend/

WORKDIR /app/apps/backend

RUN pnpm prisma generate

EXPOSE 3000

CMD ["pnpm", "dev"]

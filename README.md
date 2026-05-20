# CEFIDE — Sistema de Control de Acceso

Sistema web para el Gimnasio CEFIDE. Control de acceso por molinetes, gestión de alumnos, clases y pagos.

## Stack

- **Backend:** NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Infra:** Docker + docker-compose

## Requisitos

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose

## Setup local

```bash
# 1. Clonar e instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar con Docker
docker-compose up -d

# 4. Correr migraciones
pnpm db:migrate

# 5. Seed inicial
pnpm db:seed
```

## Desarrollo sin Docker

```bash
# Asegurar que PostgreSQL esté corriendo en localhost:5432
# Ajustar DATABASE_URL en .env si es necesario

# Levantar backend + frontend en paralelo
pnpm dev

# O por separado
pnpm dev:backend   # http://localhost:3000
pnpm dev:frontend  # http://localhost:5173
```

## Estructura

```
gym/
├── apps/
│   ├── backend/    # NestJS API
│   │   ├── prisma/ # Schema + migraciones
│   │   └── src/    # Source
│   └── frontend/   # React/Vite
│       └── src/    # Source
├── docker-compose.yml
├── .env.example
└── pnpm-workspace.yaml
```

## Endpoints

- `GET /api/health` — Health check + DB connectivity

---

*Generado con asistencia de IA — revisar antes de mergear.*

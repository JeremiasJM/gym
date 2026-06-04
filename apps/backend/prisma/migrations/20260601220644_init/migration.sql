-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'PROFESOR');

-- CreateEnum
CREATE TYPE "EstadoIngreso" AS ENUM ('VERDE', 'AMARILLO', 'ROJO');

-- CreateTable
CREATE TABLE "Alumno" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "profesorId" TEXT,
    "clasesTotal" INTEGER NOT NULL DEFAULT 0,
    "clasesUsadas" INTEGER NOT NULL DEFAULT 0,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profesor" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,

    CONSTRAINT "Profesor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'PROFESOR',
    "profesorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoIngreso" NOT NULL,
    "molinete" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigSistema" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "clasesGracia" INTEGER NOT NULL DEFAULT 2,
    "diaVencimiento" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "ConfigSistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Alumno_dni_key" ON "Alumno"("dni");

-- CreateIndex
CREATE INDEX "Alumno_profesorId_idx" ON "Alumno"("profesorId");

-- CreateIndex
CREATE INDEX "Alumno_dni_idx" ON "Alumno"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Profesor_dni_key" ON "Profesor"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_profesorId_key" ON "Usuario"("profesorId");

-- CreateIndex
CREATE INDEX "Ingreso_alumnoId_idx" ON "Ingreso"("alumnoId");

-- CreateIndex
CREATE INDEX "Ingreso_fechaHora_idx" ON "Ingreso"("fechaHora");

-- AddForeignKey
ALTER TABLE "Alumno" ADD CONSTRAINT "Alumno_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Profesor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Profesor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

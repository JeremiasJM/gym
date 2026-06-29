/*
  Warnings:

  - You are about to drop the column `clasesTotal` on the `Alumno` table. All the data in the column will be lost.
  - You are about to drop the column `clasesUsadas` on the `Alumno` table. All the data in the column will be lost.
  - You are about to drop the column `fechaPago` on the `Alumno` table. All the data in the column will be lost.
  - You are about to drop the column `pagado` on the `Alumno` table. All the data in the column will be lost.
  - You are about to drop the column `profesorId` on the `Alumno` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Frecuencia" AS ENUM ('UNA_VEZ', 'DOS_VECES', 'TRES_VECES', 'LIBRE');

-- DropForeignKey
ALTER TABLE "Alumno" DROP CONSTRAINT "Alumno_profesorId_fkey";

-- DropIndex
DROP INDEX "Alumno_profesorId_idx";

-- AlterTable
ALTER TABLE "Alumno" DROP COLUMN "clasesTotal",
DROP COLUMN "clasesUsadas",
DROP COLUMN "fechaPago",
DROP COLUMN "pagado",
DROP COLUMN "profesorId";

-- AlterTable
ALTER TABLE "ConfigSistema" ADD COLUMN     "clasesDosVeces" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN     "clasesLibre" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "clasesTresVeces" INTEGER NOT NULL DEFAULT 13,
ADD COLUMN     "clasesUnaVez" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "tiempoAmarillo" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "tiempoRojo" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "tiempoVerde" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "Ingreso" ADD COLUMN     "inscripcionId" TEXT;

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "inscripcionId" TEXT;

-- CreateTable
CREATE TABLE "Actividad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscripcionActividad" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "actividadId" TEXT NOT NULL,
    "frecuencia" "Frecuencia" NOT NULL,
    "clasesTotal" INTEGER NOT NULL,
    "clasesUsadas" INTEGER NOT NULL DEFAULT 0,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscripcionActividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProfesorActividades" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfesorActividades_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Actividad_nombre_key" ON "Actividad"("nombre");

-- CreateIndex
CREATE INDEX "InscripcionActividad_alumnoId_idx" ON "InscripcionActividad"("alumnoId");

-- CreateIndex
CREATE INDEX "InscripcionActividad_actividadId_idx" ON "InscripcionActividad"("actividadId");

-- CreateIndex
CREATE UNIQUE INDEX "InscripcionActividad_alumnoId_actividadId_key" ON "InscripcionActividad"("alumnoId", "actividadId");

-- CreateIndex
CREATE INDEX "_ProfesorActividades_B_index" ON "_ProfesorActividades"("B");

-- CreateIndex
CREATE INDEX "Ingreso_inscripcionId_idx" ON "Ingreso"("inscripcionId");

-- CreateIndex
CREATE INDEX "Pago_inscripcionId_idx" ON "Pago"("inscripcionId");

-- AddForeignKey
ALTER TABLE "InscripcionActividad" ADD CONSTRAINT "InscripcionActividad_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionActividad" ADD CONSTRAINT "InscripcionActividad_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "InscripcionActividad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "InscripcionActividad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfesorActividades" ADD CONSTRAINT "_ProfesorActividades_A_fkey" FOREIGN KEY ("A") REFERENCES "Actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfesorActividades" ADD CONSTRAINT "_ProfesorActividades_B_fkey" FOREIGN KEY ("B") REFERENCES "Profesor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

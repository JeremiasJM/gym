-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('PAGO', 'ANULACION');

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "tipo" "TipoPago" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pago_alumnoId_idx" ON "Pago"("alumnoId");

-- CreateIndex
CREATE INDEX "Pago_fecha_idx" ON "Pago"("fecha");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

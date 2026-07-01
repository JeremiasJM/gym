-- Gap B: relación Profesor <-> Actividad (m2m) + tiempos de pantalla del molinete.
-- Va DESPUÉS de 20260618133000_add_actividad_and_inscripcion (que prod ya tiene aplicada).
-- Idempotente por las dudas (guards IF NOT EXISTS / catálogo).

-- ConfigSistema: tiempos de pantalla por estado (segundos)
ALTER TABLE "ConfigSistema"
  ADD COLUMN IF NOT EXISTS "tiempoVerde"    INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS "tiempoAmarillo" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "tiempoRojo"     INTEGER NOT NULL DEFAULT 6;

-- Join table m2m Profesor <-> Actividad (A = Actividad, B = Profesor)
CREATE TABLE IF NOT EXISTS "_ProfesorActividades" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProfesorActividades_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX IF NOT EXISTS "_ProfesorActividades_B_index" ON "_ProfesorActividades"("B");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProfesorActividades_A_fkey') THEN
    ALTER TABLE "_ProfesorActividades" ADD CONSTRAINT "_ProfesorActividades_A_fkey" FOREIGN KEY ("A") REFERENCES "Actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProfesorActividades_B_fkey') THEN
    ALTER TABLE "_ProfesorActividades" ADD CONSTRAINT "_ProfesorActividades_B_fkey" FOREIGN KEY ("B") REFERENCES "Profesor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

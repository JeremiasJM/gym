/**
 * Script de migración — Sistema VERSION8 → CEFIDE (PostgreSQL/Prisma)
 *
 * Uso:
 *   cd apps/backend
 *   npx ts-node prisma/migracion/migrate.ts
 *
 * Lee archivos CSV de prisma/migracion/data/:
 *   - alumnos.csv    (obligatorio)
 *   - profesores.csv  (opcional)
 *
 * El script es IDEMPOTENTE: se puede correr múltiples veces sin duplicar datos.
 * Los errores se loguean en prisma/migracion/errores-YYYY-MM-DD.log
 */

import { PrismaClient, Frecuencia } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, 'data');

// Actividad por defecto cuando el CSV no trae columna `actividad`.
const ACTIVIDAD_DEFAULT = 'General';

// Cache nombre-actividad -> id para no re-consultar por cada fila.
const actividadCache = new Map<string, string>();

/** Upsert idempotente de Actividad por nombre, con cache. */
async function getActividadId(nombre: string): Promise<string> {
  const key = nombre.trim() || ACTIVIDAD_DEFAULT;
  const cached = actividadCache.get(key);
  if (cached) return cached;
  const act = await prisma.actividad.upsert({
    where: { nombre: key },
    update: {},
    create: { nombre: key },
  });
  actividadCache.set(key, act.id);
  return act.id;
}

/** Conecta profesor <-> actividad (m2m) de forma idempotente. */
async function conectarProfesorActividad(profesorId: string, actividadId: string) {
  await prisma.profesor.update({
    where: { id: profesorId },
    data: { actividades: { connect: { id: actividadId } } },
  });
}

/**
 * Infiere la frecuencia a partir del total de clases (los totales del sistema
 * viejo no traen frecuencia). Sólo es informativa hasta la próxima renovación.
 */
function frecuenciaDesdeClases(clasesTotal: number): Frecuencia {
  if (clasesTotal >= 30) return Frecuencia.LIBRE;
  if (clasesTotal >= 13) return Frecuencia.TRES_VECES;
  if (clasesTotal >= 9) return Frecuencia.DOS_VECES;
  return Frecuencia.UNA_VEZ;
}
const LOG_FILE = path.join(
  __dirname,
  `errores-${new Date().toISOString().split('T')[0]}.log`,
);

// Counters
let imported = 0;
let skipped = 0;
let errors = 0;
const errorLog: string[] = [];

function log(msg: string) {
  console.log(msg);
}

function logError(linea: number, motivo: string, datos: string) {
  errors++;
  const entry = `[Línea ${linea}] ${motivo} | Datos: ${datos}`;
  errorLog.push(entry);
  console.error(`  ✗ ${entry}`);
}

/**
 * Parsea CSV simple (separador ; o ,)
 * Soporta campos entre comillas
 */
function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => l.trim());

  if (lines.length < 2) return [];

  // Detectar separador
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
}

/**
 * Normaliza DNI: remueve puntos, guiones, espacios, pad a 7-8 dígitos
 */
function normalizeDni(raw: string): string | null {
  const cleaned = raw.replace(/[\.\-\s]/g, '');
  if (!/^\d{7,8}$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Migra profesores desde profesores.csv
 */
async function migrarProfesores(): Promise<Map<string, string>> {
  const dniToId = new Map<string, string>();
  const filePath = path.join(DATA_DIR, 'profesores.csv');

  if (!fs.existsSync(filePath)) {
    log('⏭  profesores.csv no encontrado — omitiendo migración de profesores');
    return dniToId;
  }

  log('\n=== Migrando Profesores ===');
  const rows = parseCsv(fs.readFileSync(filePath, 'utf-8'));
  log(`  Registros encontrados: ${rows.length}`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // +2 por header + 0-index

    // Mapeo de campos — ajustar según estructura real de VERSION8
    const dniRaw = row['dni'] || row['documento'] || row['nro_doc'] || '';
    const nombre = row['nombre'] || row['name'] || '';
    const apellido = row['apellido'] || row['surname'] || row['last_name'] || '';

    const dni = normalizeDni(dniRaw);
    if (!dni) {
      logError(lineNum, `DNI inválido: "${dniRaw}"`, JSON.stringify(row));
      continue;
    }

    if (!nombre || !apellido) {
      logError(lineNum, 'Nombre o apellido vacío', JSON.stringify(row));
      continue;
    }

    try {
      const profesor = await prisma.profesor.upsert({
        where: { dni },
        update: { nombre, apellido },
        create: { dni, nombre, apellido },
      });
      dniToId.set(dni, profesor.id);
      imported++;
    } catch (err) {
      logError(lineNum, `Error DB: ${(err as Error).message}`, JSON.stringify(row));
    }
  }

  return dniToId;
}

/**
 * Migra alumnos desde alumnos.csv
 */
async function migrarAlumnos(profesorMap: Map<string, string>): Promise<void> {
  const filePath = path.join(DATA_DIR, 'alumnos.csv');

  if (!fs.existsSync(filePath)) {
    log('\n✗ alumnos.csv no encontrado — nada que migrar');
    return;
  }

  log('\n=== Migrando Alumnos ===');
  const rows = parseCsv(fs.readFileSync(filePath, 'utf-8'));
  log(`  Registros encontrados: ${rows.length}`);

  // Recopilar DNIs para detectar duplicados en el archivo
  const dnisSeen = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2;

    // Mapeo de campos — soporta formato VERSION8 parser y CSV manual
    const dniRaw = row['dni'] || row['documento'] || row['nro_doc'] || row['doc'] || '';
    const nombre = row['nombre'] || row['name'] || '';
    const apellido = row['apellido'] || row['surname'] || row['last_name'] || '';
    const profesorDni = row['profesor_dni'] || row['prof_dni'] || row['dni_profesor'] || '';
    const activo = row['activo'] || row['estado'] || row['active'] || '1';
    const clasesTotal = parseInt(row['clases_total'] || row['clases'] || '0', 10);
    const clasesUsadas = parseInt(row['clases_usadas'] || row['clases_realizadas'] || '0', 10);
    const pagado = row['pagado'] || row['pago'] || '';
    const actividadNombre = row['actividad'] || ACTIVIDAD_DEFAULT;
    // Campos extra de VERSION8 parser (informativos, no se usan)
    const _domicilio = row['domicilio'] || '';
    const _telefono = row['telefono'] || '';
    const _localidad = row['localidad'] || '';

    // Validar DNI
    const dni = normalizeDni(dniRaw);
    if (!dni) {
      logError(lineNum, `DNI inválido: "${dniRaw}"`, JSON.stringify(row));
      continue;
    }

    // Detectar duplicados en archivo fuente
    if (dnisSeen.has(dni)) {
      logError(
        lineNum,
        `DNI duplicado en archivo (primera vez en línea ${dnisSeen.get(dni)})`,
        `DNI: ${dni}`,
      );
      skipped++;
      continue;
    }
    dnisSeen.set(dni, lineNum);

    if (!nombre || !apellido) {
      logError(lineNum, 'Nombre o apellido vacío', JSON.stringify(row));
      continue;
    }

    // Resolver profesor
    let profesorId: string | null = null;
    if (profesorDni) {
      const normalizedProfDni = normalizeDni(profesorDni);
      if (normalizedProfDni) {
        profesorId = profesorMap.get(normalizedProfDni) || null;
        if (!profesorId) {
          // Buscar en DB por si ya existe
          const prof = await prisma.profesor.findUnique({
            where: { dni: normalizedProfDni },
          });
          profesorId = prof?.id || null;
        }
      }
    }

    // Normalizar activo
    const isActivo = ['1', 'true', 'si', 'sí', 'activo', 's'].includes(
      activo.toLowerCase(),
    );

    // Normalizar pagado
    const isPagado = ['1', 'true', 'si', 'sí', 's'].includes(
      pagado.toLowerCase(),
    );

    const total = isNaN(clasesTotal) ? 0 : clasesTotal;
    const usadas = isNaN(clasesUsadas) ? 0 : clasesUsadas;

    try {
      // 1) Alumno (los datos de clases/pago ya NO viven acá)
      const alumno = await prisma.alumno.upsert({
        where: { dni },
        update: { nombre, apellido, activo: isActivo },
        create: { dni, nombre, apellido, activo: isActivo },
      });

      // 2) Actividad de la inscripción (+ profesor a cargo si corresponde)
      const actividadId = await getActividadId(actividadNombre);
      if (profesorId) {
        await conectarProfesorActividad(profesorId, actividadId);
      }

      // 3) Inscripción: clases/pago del sistema viejo van acá
      await prisma.inscripcionActividad.upsert({
        where: { alumnoId_actividadId: { alumnoId: alumno.id, actividadId } },
        update: {
          frecuencia: frecuenciaDesdeClases(total),
          clasesTotal: total,
          clasesUsadas: usadas,
          pagado: isPagado,
          fechaPago: isPagado ? new Date() : null,
        },
        create: {
          alumnoId: alumno.id,
          actividadId,
          frecuencia: frecuenciaDesdeClases(total),
          clasesTotal: total,
          clasesUsadas: usadas,
          pagado: isPagado,
          fechaPago: isPagado ? new Date() : null,
        },
      });
      imported++;
    } catch (err) {
      logError(lineNum, `Error DB: ${(err as Error).message}`, JSON.stringify(row));
    }
  }
}

async function main() {
  log('╔══════════════════════════════════════════╗');
  log('║  Migración VERSION8 → CEFIDE            ║');
  log('╚══════════════════════════════════════════╝');
  log(`\nDirectorio datos: ${DATA_DIR}`);
  log(`Log errores:      ${LOG_FILE}\n`);

  // Verificar que exista directorio de datos
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    log('✗ Directorio data/ creado pero vacío.');
    log('  Colocar alumnos.csv (y opcionalmente profesores.csv) en:');
    log(`  ${DATA_DIR}`);
    return;
  }

  const profesorMap = await migrarProfesores();
  await migrarAlumnos(profesorMap);

  // Escribir log de errores
  if (errorLog.length > 0) {
    fs.writeFileSync(LOG_FILE, errorLog.join('\n'), 'utf-8');
  }

  log('\n══════════════════════════════════════════');
  log(`  Importados:   ${imported}`);
  log(`  Omitidos:     ${skipped}`);
  log(`  Errores:      ${errors}`);
  if (errors > 0) {
    log(`  Ver errores:  ${LOG_FILE}`);
  }
  log('══════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

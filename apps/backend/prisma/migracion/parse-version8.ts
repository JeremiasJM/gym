/**
 * Parser VERSION8 CLI.ASC → alumnos.csv
 *
 * Lee el export binario de Btrieve del sistema viejo y genera
 * un CSV limpio listo para importar con migrate.ts
 *
 * Uso:
 *   npx ts-node prisma/migracion/parse-version8.ts <ruta-a-CLI.ASC>
 *
 * Salida:
 *   prisma/migracion/data/alumnos.csv
 *   prisma/migracion/data/parse-report.txt  (resumen de lo parseado)
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Configuración ──────────────────────────────────────────────

const VERSION8_PATH = process.argv[2];
if (!VERSION8_PATH) {
  console.error('Uso: npx ts-node prisma/migracion/parse-version8.ts <ruta-a-CLI.ASC>');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, 'data');
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'alumnos.csv');
const OUTPUT_REPORT = path.join(OUTPUT_DIR, 'parse-report.txt');

// ── Estructura TipoCli (194 bytes por registro) ────────────────
// Offsets relativos al inicio del registro (después del prefijo "194,")
const FIELDS = {
  COD:         { offset: 0,   length: 2,  type: 'uint16' },
  NOMBRE:      { offset: 2,   length: 25, type: 'string' },
  DOMICILIO:   { offset: 27,  length: 25, type: 'string' },
  BARRIO:      { offset: 52,  length: 15, type: 'string' },
  CODPOS:      { offset: 67,  length: 2,  type: 'uint16' },
  CODPCIA:     { offset: 69,  length: 1,  type: 'string' },
  TEL:         { offset: 70,  length: 15, type: 'string' },
  LOCA:        { offset: 85,  length: 15, type: 'string' },
  IVA:         { offset: 100, length: 1,  type: 'string' },
  CREDITO:     { offset: 101, length: 4,  type: 'float'  },
  CUIT:        { offset: 105, length: 13, type: 'string' },
  VENDEDOR:    { offset: 118, length: 1,  type: 'string' },
  REPARTO:     { offset: 119, length: 1,  type: 'string' },
  LISTA:       { offset: 120, length: 1,  type: 'string' },
  SALDO:       { offset: 121, length: 4,  type: 'float'  },
  FECHNAC:     { offset: 125, length: 4,  type: 'int32'  },
  SEXO:        { offset: 129, length: 1,  type: 'string' },
  FECHING:     { offset: 130, length: 4,  type: 'int32'  },
  DEPORTE:     { offset: 134, length: 30, type: 'string' },
  PORLASDUDAS: { offset: 164, length: 28, type: 'string' },
  ACTIVIDAD:   { offset: 192, length: 2,  type: 'uint16' },
} as const;

const RECORD_SIZE = 194;
const PREFIX = Buffer.from('194,');

// ── Mapeo de normalización de actividades CEFIDE ───────────────
const ACTIVIDAD_MAP: Record<string, string> = {
  // Aparatos / Gimnasio (la actividad principal del CEFIDE)
  'APARATOS': 'APARATOS',
  'APARTOS': 'APARATOS',
  'APARATO': 'APARATOS',
  'APARARTOS': 'APARATOS',
  'APAARTOS': 'APARATOS',
  'APPARATOS': 'APARATOS',
  'APRATOS': 'APARATOS',
  'APARAATOS': 'APARATOS',
  'APARAAAATOS': 'APARATOS',
  'AAPARATOS': 'APARATOS',
  'AOARATOS': 'APARATOS',
  'APAPRATOS': 'APARATOS',
  'APARATOSD': 'APARATOS',
  'APARATOSW': 'APARATOS',
  'APARATOZ': 'APARATOS',
  'APARATOA': 'APARATOS',
  'APARATPS': 'APARATOS',
  'AP-ARATOS': 'APARATOS',
  'PARATOS': 'APARATOS',
  'APARTO': 'APARATOS',

  'GIMNASIO': 'GIMNASIO',
  'GIMNAISO': 'GIMNASIO',
  'GIMNASIIO': 'GIMNASIO',
  'GIMANSIO': 'GIMNASIO',
  'GIMNSIO': 'GIMNASIO',
  'GIMASIO': 'GIMNASIO',
  'GIMMASIO': 'GIMNASIO',
  'GIMKNASIO': 'GIMNASIO',
  'GIMNADIO': 'GIMNASIO',
  'GIMLNASIO': 'GIMNASIO',
  'GINNASIO': 'GIMNASIO',
  'GINMASIO': 'GIMNASIO',
  'GMNASIO': 'GIMNASIO',
  'IMNASIO': 'GIMNASIO',
  'GIMNASIA': 'GIMNASIO',

  // Aero
  'AERO': 'AERO',
  'AERO2': 'AERO',
  'AERO 2': 'AERO',
  'AEROBIC': 'AERO',
  'AEROBICS': 'AERO',
  'AEROBICAS': 'AERO',
  'AAEROBIC': 'AERO',
  'AEROBICA': 'AERO',
  'AERO ZUMBA': 'AERO',

  // Spinning
  'SPINNING': 'SPINNING',
  'SPINING': 'SPINNING',
  'SPININIG': 'SPINNING',
  'SPINNG': 'SPINNING',

  // Otras actividades CEFIDE
  'YOGA': 'YOGA',
  'ESCALADA': 'ESCALADA',
  'ESCALADA KIDS': 'ESCALADA',
  'ESCALADA KID': 'ESCALADA',
  'BOXEO': 'BOXEO',
  'BOX': 'BOXEO',
  'CROSS TRAINING': 'CROSS TRAINING',
  'CROSS TRAINNING': 'CROSS TRAINING',
  'CROSS TR': 'CROSS TRAINING',
  'CROSS FIT': 'CROSS TRAINING',
  'CROSS': 'CROSS TRAINING',
  'PILATES': 'PILATES',
  'PILATES REFORMER': 'PILATES',
  'FUNCIONAL': 'FUNCIONAL',
  'ZUMBA': 'ZUMBA',
  'KINESIOLOGIA': 'KINESIOLOGIA',
  'REHABILITACION': 'REHABILITACION',
  'PERSONAL TRAINER': 'PERSONAL TRAINER',
};

// ── Funciones de parsing ───────────────────────────────────────

function readString(buf: Buffer, offset: number, length: number): string {
  return buf.slice(offset, offset + length)
    .toString('latin1')
    .replace(/[\x00-\x1f]/g, '') // Remove control chars
    .trim();
}

function extractDni(cuitField: string): string | null {
  // Remove all non-numeric
  const nums = cuitField.replace(/[^0-9]/g, '');
  // Argentine DNI: 7-8 digits
  if (nums.length >= 7 && nums.length <= 8) return nums;
  // CUIT format: 2 digits + 8 digits DNI + 1 digit. Extract middle.
  if (nums.length === 11) return nums.slice(2, 10);
  return null;
}

function splitNombreApellido(raw: string): { nombre: string; apellido: string } {
  // Remove suffixes: /A2, (A), [A], /PR, [A], F., J., etc.
  let clean = raw
    .replace(/\/A2$/i, '')
    .replace(/\(A\)$/i, '')
    .replace(/\[A\]$/i, '')
    .replace(/\/PR$/i, '')
    .replace(/\s+[A-Z]\.\s*$/i, '') // trailing initials like "F."
    .trim();

  // Format is usually "APELLIDO NOMBRE" or "APELLIDO NOMBRE SEGUNDO_NOMBRE"
  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { nombre: '', apellido: '' };
  if (parts.length === 1) return { nombre: parts[0], apellido: parts[0] };

  // Handle compound surnames with prepositions: DE, DEL, DI, LA, LOS, etc.
  const prepositions = ['DE', 'DEL', 'DI', 'LA', 'LAS', 'LOS', 'DA', 'DOS', 'VAN', 'VON'];
  let apellidoParts = 1;

  // If first word is a preposition, include next word in apellido
  if (prepositions.includes(parts[0].toUpperCase())) {
    apellidoParts = 2;
    // If second word is also a preposition (e.g. "DE LA"), include one more
    if (parts.length > 2 && prepositions.includes(parts[1].toUpperCase())) {
      apellidoParts = 3;
    }
  }

  // Ensure we leave at least one part for nombre
  if (apellidoParts >= parts.length) {
    apellidoParts = Math.max(1, parts.length - 1);
  }

  const apellido = parts.slice(0, apellidoParts).join(' ');
  const nombre = parts.slice(apellidoParts).join(' ');

  return {
    nombre: titleCase(nombre),
    apellido: titleCase(apellido),
  };
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function normalizeActividad(raw: string): string | null {
  if (!raw || raw.length < 2) return null;
  const upper = raw.toUpperCase().trim();

  // Direct match
  if (ACTIVIDAD_MAP[upper]) return ACTIVIDAD_MAP[upper];

  // Fuzzy match
  for (const [key, value] of Object.entries(ACTIVIDAD_MAP)) {
    if (upper.startsWith(key) || upper.includes(key)) return value;
  }

  // Check if starts with common prefixes
  if (upper.match(/^APARA?T/)) return 'APARATOS';
  if (upper.match(/^GIM/)) return 'GIMNASIO';
  if (upper.match(/^AERO/)) return 'AERO';
  if (upper.match(/^SPIN/)) return 'SPINNING';
  if (upper.match(/^ESCAL/)) return 'ESCALADA';
  if (upper.match(/^BOX/)) return 'BOXEO';
  if (upper.match(/^CROSS/)) return 'CROSS TRAINING';
  if (upper.match(/^PILAT/)) return 'PILATES';
  if (upper.match(/^FUNC/)) return 'FUNCIONAL';
  if (upper.match(/^YOGA/)) return 'YOGA';
  if (upper.match(/^ZUMBA/)) return 'ZUMBA';
  if (upper.match(/^KINESIO/)) return 'KINESIOLOGIA';
  if (upper.match(/^REHAB/)) return 'REHABILITACION';

  return null; // Not a CEFIDE activity (external sport, notes, etc.)
}

function escapeCsv(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ── Main ───────────────────────────────────────────────────────

function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Parser VERSION8 CLI.ASC → alumnos.csv      ║');
  console.log('╚══════════════════════════════════════════════╝');

  if (!fs.existsSync(VERSION8_PATH)) {
    console.error(`\nArchivo no encontrado: ${VERSION8_PATH}`);
    process.exit(1);
  }

  const buf = fs.readFileSync(VERSION8_PATH);
  console.log(`\nArchivo: ${VERSION8_PATH}`);
  console.log(`Tamaño: ${(buf.length / 1024).toFixed(1)} KB`);

  // Parse all records
  interface RawRecord {
    cod: number;
    nombre: string;
    domicilio: string;
    barrio: string;
    tel: string;
    localidad: string;
    cuit: string;
    deporte: string;
    actividadCefide: string;
  }

  const rawRecords: RawRecord[] = [];
  let pos = 0;

  while (pos < buf.length) {
    // Find next "194," marker
    if (
      buf[pos] === PREFIX[0] &&
      buf[pos + 1] === PREFIX[1] &&
      buf[pos + 2] === PREFIX[2] &&
      buf[pos + 3] === PREFIX[3]
    ) {
      const start = pos + 4;
      if (start + RECORD_SIZE > buf.length) break;

      const cod = buf.readUInt16LE(start + FIELDS.COD.offset);
      const nombre = readString(buf, start + FIELDS.NOMBRE.offset, FIELDS.NOMBRE.length);
      const domicilio = readString(buf, start + FIELDS.DOMICILIO.offset, FIELDS.DOMICILIO.length);
      const barrio = readString(buf, start + FIELDS.BARRIO.offset, FIELDS.BARRIO.length);
      const tel = readString(buf, start + FIELDS.TEL.offset, FIELDS.TEL.length);
      const localidad = readString(buf, start + FIELDS.LOCA.offset, FIELDS.LOCA.length);
      const cuit = readString(buf, start + FIELDS.CUIT.offset, FIELDS.CUIT.length);
      const deporte = readString(buf, start + FIELDS.DEPORTE.offset, FIELDS.DEPORTE.length);
      const actividadCefide = readString(buf, start + FIELDS.PORLASDUDAS.offset, FIELDS.PORLASDUDAS.length);

      // Filter out junk records
      if (nombre && nombre.length > 2 && !nombre.includes('VENTA DE MOSTRADOR')) {
        rawRecords.push({ cod, nombre, domicilio, barrio, tel, localidad, cuit, deporte, actividadCefide });
      }

      pos = start + RECORD_SIZE;
    } else {
      pos++;
    }
  }

  console.log(`Registros parseados: ${rawRecords.length}`);

  // Process and clean records
  interface CleanRecord {
    cod: number;
    dni: string;
    nombre: string;
    apellido: string;
    domicilio: string;
    telefono: string;
    localidad: string;
    actividad: string;
    deporteExterno: string;
    activo: string;
  }

  const cleanRecords: CleanRecord[] = [];
  const dniSeen = new Set<string>();
  const report: string[] = [];

  let totalParsed = 0;
  let withDni = 0;
  let withoutDni = 0;
  let duplicateDni = 0;
  const actividadCount: Record<string, number> = {};

  for (const raw of rawRecords) {
    totalParsed++;

    const { nombre, apellido } = splitNombreApellido(raw.nombre);
    if (!nombre && !apellido) continue;

    const dni = extractDni(raw.cuit);

    // Normalize actividad CEFIDE (from "porlasdudas" field = real gym activity)
    const actividad = normalizeActividad(raw.actividadCefide) || normalizeActividad(raw.deporte) || '';

    if (actividad) {
      actividadCount[actividad] = (actividadCount[actividad] || 0) + 1;
    }

    if (dni) {
      if (dniSeen.has(dni)) {
        duplicateDni++;
        report.push(`DNI DUPLICADO: ${dni} — ${apellido}, ${nombre} (cod ${raw.cod})`);
        continue;
      }
      dniSeen.add(dni);
      withDni++;
    } else {
      withoutDni++;
    }

    // Clean phone: remove prefix letters
    const tel = raw.tel.replace(/^[A-Za-z]+/, '').trim();

    cleanRecords.push({
      cod: raw.cod,
      dni: dni || '',
      nombre,
      apellido,
      domicilio: raw.domicilio,
      telefono: tel,
      localidad: raw.localidad,
      actividad,
      deporteExterno: actividad ? '' : raw.deporte, // Keep external sport only if no CEFIDE activity
      activo: '1', // All imported as active; deactivate manually later
    });
  }

  // Sort: records WITH DNI first (most useful), then by cod
  cleanRecords.sort((a, b) => {
    if (a.dni && !b.dni) return -1;
    if (!a.dni && b.dni) return 1;
    return a.cod - b.cod;
  });

  // Write CSV
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const headers = ['dni', 'nombre', 'apellido', 'domicilio', 'telefono', 'localidad', 'actividad', 'activo'];
  const csvLines = [headers.join(',')];

  // Only export records WITH DNI (the rest can't be used in new system without DNI)
  const exportable = cleanRecords.filter((r) => r.dni);

  for (const rec of exportable) {
    csvLines.push(
      [
        rec.dni,
        escapeCsv(rec.nombre),
        escapeCsv(rec.apellido),
        escapeCsv(rec.domicilio),
        escapeCsv(rec.telefono),
        escapeCsv(rec.localidad),
        escapeCsv(rec.actividad),
        rec.activo,
      ].join(','),
    );
  }

  fs.writeFileSync(OUTPUT_CSV, csvLines.join('\n'), 'utf-8');

  // Write report
  report.unshift('');
  report.unshift('══════════════════════════════════════════════════');
  report.unshift(`Parser VERSION8 CLI.ASC — ${new Date().toISOString()}`);
  report.unshift('══════════════════════════════════════════════════');
  report.push('');
  report.push('=== Resumen ===');
  report.push(`Total registros parseados: ${totalParsed}`);
  report.push(`Con DNI válido:            ${withDni}`);
  report.push(`Sin DNI (no exportados):   ${withoutDni}`);
  report.push(`DNIs duplicados omitidos:  ${duplicateDni}`);
  report.push(`Exportados a CSV:          ${exportable.length}`);
  report.push('');
  report.push('=== Actividades CEFIDE detectadas ===');
  Object.entries(actividadCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => report.push(`  ${String(v).padStart(5)}  ${k}`));
  report.push('');
  report.push('=== Registros SIN DNI (no exportados, necesitan carga manual) ===');
  const sinDni = cleanRecords.filter((r) => !r.dni).slice(0, 50);
  sinDni.forEach((r) =>
    report.push(`  cod ${r.cod}: ${r.apellido}, ${r.nombre} — ${r.actividad || 'sin actividad'}`),
  );
  if (withoutDni > 50) {
    report.push(`  ... y ${withoutDni - 50} más`);
  }

  fs.writeFileSync(OUTPUT_REPORT, report.join('\n'), 'utf-8');

  // Console summary
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  Total registros:          ${totalParsed}`);
  console.log(`  Con DNI válido:           ${withDni}`);
  console.log(`  Sin DNI (no exportados):  ${withoutDni}`);
  console.log(`  DNIs duplicados:          ${duplicateDni}`);
  console.log(`  → Exportados a CSV:       ${exportable.length}`);
  console.log('══════════════════════════════════════════════════');
  console.log(`\n  CSV:     ${OUTPUT_CSV}`);
  console.log(`  Reporte: ${OUTPUT_REPORT}`);
  console.log('\nActividades detectadas:');
  Object.entries(actividadCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${String(v).padStart(5)}  ${k}`));
  console.log('\nSiguiente paso: revisar alumnos.csv y luego correr:');
  console.log('  npx ts-node prisma/migracion/migrate.ts');
}

main();

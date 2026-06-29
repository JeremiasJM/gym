# Migración VERSION8 → CEFIDE

## Requisitos previos

1. Base de datos PostgreSQL corriendo con schema aplicado (`pnpm db:migrate`)
2. Archivos CSV exportados del sistema VERSION8

## Estructura de archivos

```
prisma/migracion/
├── data/
│   ├── alumnos.csv           ← datos reales (no commitear)
│   ├── profesores.csv        ← datos reales (no commitear)
│   ├── alumnos.ejemplo.csv   ← template de referencia
│   └── profesores.ejemplo.csv
├── migrate.ts                ← script principal
└── README.md
```

## Formato CSV esperado

### alumnos.csv (obligatorio)

```csv
dni;nombre;apellido;profesor_dni;activo;actividad;clases_total;clases_usadas;pagado
12345678;María;González;87654321;1;Pilates;8;3;si
```

**Campos reconocidos** (acepta variantes):

| Campo | Variantes aceptadas |
|---|---|
| DNI | `dni`, `documento`, `nro_doc`, `doc` |
| Nombre | `nombre`, `name` |
| Apellido | `apellido`, `surname`, `last_name` |
| Profesor | `profesor_dni`, `prof_dni`, `dni_profesor` |
| Activo | `activo`, `estado`, `active` (1/true/si/sí/s) |
| Actividad | `actividad` (opcional — default `General`) |
| Clases total | `clases_total`, `clases` |
| Clases usadas | `clases_usadas`, `clases_realizadas` |
| Pagado | `pagado`, `pago` (1/true/si/sí/s) |

> **Modelo nuevo:** clases/pago se cargan en una **inscripción a una actividad**
> (`InscripcionActividad`), no en el alumno. Cada fila crea: Alumno +
> Actividad (por nombre) + Inscripción. Si viene `profesor_dni`, ese profesor
> queda **a cargo de la actividad** (relación profesor↔actividad). La
> frecuencia se infiere del total de clases (ajustable luego desde el panel).

### profesores.csv (opcional)

```csv
dni;nombre;apellido
87654321;Roberto;Sánchez
```

## Ejecución

```bash
cd apps/backend

# 1. Colocar CSVs en prisma/migracion/data/
# 2. Ejecutar migración
pnpm migrate:v8
```

## Características

- **Idempotente**: usa `upsert` — se puede correr múltiples veces sin duplicar
- **Detecta DNIs duplicados** en el archivo fuente antes de importar
- **Normaliza DNIs**: remueve puntos, guiones, espacios
- **Log de errores**: genera `errores-YYYY-MM-DD.log` con línea y motivo
- **No detiene ante errores**: sigue procesando registros válidos
- **Separador flexible**: detecta `;` o `,` automáticamente

## Exportar desde VERSION8

El sistema VERSION8 probablemente usa una base de datos Access (.mdb) o similar. Para exportar:

1. Abrir la DB en Access o herramienta compatible
2. Seleccionar tabla de alumnos
3. Exportar como CSV (delimitado por `;`)
4. Repetir para tabla de profesores si existe
5. Renombrar archivos a `alumnos.csv` y `profesores.csv`
6. Colocar en `prisma/migracion/data/`

**Nota:** Si el sistema viejo usa otro formato (DBF, SQL Server, etc.), contactar al equipo para adaptar el script de lectura.

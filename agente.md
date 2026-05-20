# Prompt de Ejecución — Agente de Desarrollo
## Sistema de Control de Acceso y Gestión de Alumnos
### Cliente: Gimnasio CEFIDE

---

## INSTRUCCIONES DE USO DEL AGENTE

Antes de comenzar cualquier tarea, el agente debe:
1. Leer este prompt completo
2. Respetar el stack y convenciones definidas en la Guía de Desarrollo Fullmindtech
3. Trabajar módulo por módulo, nunca de forma monolítica
4. Abrir una nueva sesión de chat por cada módulo o funcionalidad nueva
5. Todo código generado debe ser revisado por el desarrollador antes de commitear

---

## CONTEXTO DEL PROYECTO

Sistema web para el Gimnasio CEFIDE que reemplaza un software obsoleto (~año 2000). El objetivo es simple y acotado: controlar el acceso físico al gimnasio mediante molinetes y gestionar alumnos, clases y pagos. Sin módulos contables, sin facturación, sin stock.

El sistema tiene dos interfaces principales:
- **Panel de administración** (web, para secretaria y dueño)
- **Terminal de acceso** (modo kiosco, para que el socio ingrese su DNI frente al molinete)

---

## STACK OBLIGATORIO

Respetar estrictamente la Guía de Desarrollo Fullmindtech:

- **Backend:** Node.js con NestJS + TypeScript
- **Base de datos:** PostgreSQL
- **ORM:** Prisma (migraciones obligatorias, NUNCA cambios manuales en DB)
- **Frontend:** React + Vite + TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** shadcn/ui
- **Estado global:** Zustand
- **Data fetching:** SWR
- **Contenedores:** Docker + docker-compose para desarrollo local
- **Deploy:** Dokploy
- **DNS / Red:** Cloudflare
- **Storage:** Cloudflare R2 (si se requiere almacenamiento de archivos)
- **Package manager:** pnpm (obligatorio, no usar npm ni yarn)
- **Credenciales:** Vaultwarden (nunca en el repo ni en el chat)

---

## DISEÑO VISUAL — IDENTIDAD CEFIDE

El diseño debe estar en sintonía con el logo del gimnasio: figura humana estilo Da Vinci, blanco sobre negro, estilo minimalista y fuerte.

**Paleta de colores:**
```
--color-bg:         #0a0a0a   /* Negro profundo, fondo principal */
--color-surface:    #141414   /* Superficie de cards y paneles */
--color-border:     #2a2a2a   /* Bordes sutiles */
--color-text:       #f0f0f0   /* Texto principal */
--color-muted:      #888888   /* Texto secundario */
--color-accent:     #c8f000   /* Verde lima — acento principal, botones CTA */
--color-accent-alt: #e63946   /* Rojo — estado bloqueado / acceso denegado */
--color-warning:    #f4a261   /* Naranja — estado amarillo / clases de gracia */
--color-success:    #57cc99   /* Verde suave — acceso permitido */
```

**Tipografía:** Inter o Geist (ambas disponibles en Google Fonts / Vercel Fonts)

**Principios de UI:**
- Interfaz oscura, densa pero legible
- Sin decoraciones innecesarias
- Los estados de acceso (verde / amarillo / rojo) deben ser visualmente dominantes en la terminal kiosco
- El panel admin debe priorizar la densidad de información sobre el diseño decorativo

---

## ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────┐
│              FRONTEND (React/Vite)           │
│                                             │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │ Panel Admin  │    │ Terminal Kiosco  │   │
│  │ /admin/*     │    │ /kiosco          │   │
│  └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│           BACKEND (NestJS API)              │
│                                             │
│  /api/auth      /api/alumnos                │
│  /api/acceso    /api/clases                 │
│  /api/reportes  /api/molinete               │
└─────────────────────────────────────────────┘
                        │
               ┌────────┴────────┐
               ▼                 ▼
        PostgreSQL         Servicio COM
        (Prisma ORM)       (proceso local
                            Node.js, corre
                            en la PC del
                            gimnasio)
```

**Nota crítica de arquitectura:** El driver del puerto serie DEBE correr como un proceso local en la PC física conectada al molinete. No puede vivir en la nube. Si el deploy es híbrido (backend en nube), este proceso local hace POST al backend para registrar el ingreso y recibe la señal de apertura.

---

## MODELO DE DATOS (Prisma Schema base)

```prisma
model Alumno {
  id            String    @id @default(cuid())
  dni           String    @unique
  nombre        String
  apellido      String
  activo        Boolean   @default(true)
  profesorId    String?
  profesor      Profesor? @relation(fields: [profesorId], references: [id])
  clasesTotal   Int       @default(0)
  clasesUsadas  Int       @default(0)
  pagado        Boolean   @default(false)
  fechaPago     DateTime?
  ingresos      Ingreso[]
  creadoEn      DateTime  @default(now())
  actualizadoEn DateTime  @updatedAt
}

model Profesor {
  id       String   @id @default(cuid())
  dni      String   @unique
  nombre   String
  apellido String
  usuario  Usuario?
  alumnos  Alumno[]
}

model Usuario {
  id         String   @id @default(cuid())
  email      String   @unique
  password   String
  rol        Rol      @default(PROFESOR)
  profesorId String?  @unique
  profesor   Profesor? @relation(fields: [profesorId], references: [id])
}

model Ingreso {
  id        String   @id @default(cuid())
  alumnoId  String
  alumno    Alumno   @relation(fields: [alumnoId], references: [id])
  fechaHora DateTime @default(now())
  estado    EstadoIngreso
  molinete  Int      @default(1)
}

model ConfigSistema {
  id             String @id @default("global")
  clasesGracia   Int    @default(2)
  diaVencimiento Int    @default(5)
}

enum Rol {
  ADMIN
  PROFESOR
}

enum EstadoIngreso {
  VERDE
  AMARILLO
  ROJO
}
```

---

## MÓDULOS A DESARROLLAR — ORDEN DE EJECUCIÓN

Respetar este orden. No avanzar al siguiente módulo sin que el anterior esté funcionando y testeado localmente.

---

### MÓDULO 1 — Setup inicial del proyecto

**Una sesión de chat por tarea.**

Tareas:
- Inicializar repo con estructura NestJS + React/Vite en monorepo usando pnpm workspaces
- Configurar Prisma con PostgreSQL
- Configurar docker-compose con servicio de app + postgres
- Crear `.env.example` con todas las variables necesarias
- README con instrucciones para levantar en local

Criterios de aceptación:
- `pnpm install` instala todas las dependencias sin errores
- `docker-compose up` levanta todo sin errores
- Prisma conecta a la DB correctamente
- Frontend muestra pantalla en blanco sin errores de consola

---

### MÓDULO 2 — Autenticación y roles

Tareas:
- Endpoint `POST /api/auth/login` con JWT
- Guard de roles: ADMIN y PROFESOR
- Refresh token básico
- Frontend: pantalla de login con diseño oscuro según paleta CEFIDE
- Redirección post-login según rol

Criterios de aceptación:
- Admin ve el panel completo
- Profesor solo accede a su vista restringida
- Token inválido retorna 401
- No hay rutas admin accesibles sin autenticación

---

### MÓDULO 3 — ABM de alumnos

Tareas:
- CRUD completo de alumnos (`/api/alumnos`)
- Asociación alumno → profesor
- Estado activo/inactivo
- DNI único, validación en backend
- Frontend: listado con búsqueda, formulario alta/edición, baja lógica

Criterios de aceptación:
- No se puede crear dos alumnos con el mismo DNI
- Profesor solo ve sus alumnos
- Admin ve todos los alumnos filtrados por profesor/actividad
- Baja es lógica (activo = false), no se eliminan registros

---

### MÓDULO 4 — Gestión de clases y pagos

Tareas:
- Asignación de cantidad de clases al alumno
- Registro de pago (sí/no + fecha)
- Lógica de estado de acceso:
  - VERDE: pagado y tiene clases
  - AMARILLO: no pagó pero tiene clases de gracia disponibles (configurable)
  - ROJO: sin clases de gracia o sin pago después del vencimiento
- Renovación mensual automática (cron job: lunes siguiente al día 30/31)
- Usuario especial con DNI ficticio que siempre pasa en VERDE (para dueño/profe)
- Frontend: pantalla de asignación de clases y estado de pago por alumno

Criterios de aceptación:
- El estado de acceso se calcula correctamente en los 3 casos
- Las clases de gracia son configurables desde el panel admin
- La renovación mensual no rompe el historial de ingresos
- El usuario comodín siempre retorna VERDE sin importar el estado

---

### MÓDULO 5 — Control de acceso y driver molinete

**Este módulo es el más crítico. Leer bien antes de codear.**

Contexto del hardware:
- Placa: DCM PCA150
- Protocolo: contacto seco, pulso de 500 ms en el pin de Habilitación Entrada
- Hay 2 molinetes físicos, cada uno conectado a una PC distinta por puerto COM
- El driver es un proceso Node.js local que corre en la PC del gimnasio

Tareas:
- Servicio local Node.js que expone endpoint HTTP interno (ej: `localhost:3001/abrir`)
- Al recibir el POST, abre el puerto COM y manda pulso de 500 ms al pin HAB1/HAB2 de la PCA150
- El backend principal llama a este servicio local cuando valida el acceso
- Botón de contingencia en panel admin: hace POST directo al servicio local de cualquiera de los 2 molinetes
- Registrar en DB el ingreso con estado (VERDE/AMARILLO/ROJO), timestamp y número de molinete

Criterios de aceptación:
- El pulso dura exactamente 500 ms (según spec de la PCA150)
- Si el servicio COM no responde, el backend retorna error controlado (no crash)
- El botón de contingencia funciona independientemente del estado del alumno
- Cada ingreso queda registrado en la tabla `Ingreso`

---

### MÓDULO 6 — Terminal kiosco

Tareas:
- Ruta `/kiosco` en el frontend, pantalla completa sin navbar ni navegación
- Input numérico grande para ingresar DNI (compatible con teclado físico y táctil)
- Al enviar DNI: llamar `POST /api/acceso/validar`
- Mostrar feedback visual dominante:
  - VERDE: fondo verde, nombre del alumno, clases restantes
  - AMARILLO: fondo naranja, nombre, clases de gracia restantes, mensaje de aviso de pago
  - ROJO: fondo rojo, mensaje de acceso bloqueado
- Timeout de 3 segundos y volver al input limpio automáticamente
- La pantalla debe funcionar sin mouse (solo teclado numérico)

Criterios de aceptación:
- El feedback visual es claro a 2 metros de distancia
- El input se limpia automáticamente tras cada intento
- No hay ningún elemento de navegación visible
- Funciona correctamente con teclado físico numérico

---

### MÓDULO 7 — Log de ingresos y reportes

Tareas:
- Pantalla de log en panel admin: historial de ingresos con filtros por fecha, alumno, profesor, estado
- Reporte por actividad: listado con nombre, apellido, clases realizadas, clases pendientes, estado de pago
- Exportación a CSV/Excel del reporte
- Vista acotada para profesor: buscar alumno por DNI, ver nombre + clase asignada + clases restantes

Criterios de aceptación:
- El log es paginado (no cargar todos los registros de una)
- El reporte exportado tiene el formato correcto y se puede abrir en Excel
- El profesor no puede ver datos de alumnos de otros profesores desde ningún endpoint

---

### MÓDULO 8 — Migración de datos

Tareas:
- Analizar estructura del sistema anterior (VERSION8)
- Mapear campos del sistema viejo al schema de Prisma
- Script de migración: leer datos del sistema viejo, transformar y cargar en PostgreSQL
- Validar que no haya DNIs duplicados antes de importar
- Log de errores de migración (registros que no pudieron importarse y por qué)

Criterios de aceptación:
- El script es idempotente (se puede correr más de una vez sin duplicar datos)
- Los errores se loguean en un archivo, no detienen la importación completa
- Después de la migración, el sistema funciona con los datos reales

---

## REGLAS GENERALES DEL AGENTE

1. **Package manager: pnpm siempre.** Nunca usar npm install ni yarn. Usar pnpm install, pnpm add, pnpm run.
2. **No hacer cambios en DB a mano.** Todo por migraciones Prisma.
3. **No guardar credenciales en el repo.** Usar `.env` + `.env.example`.
4. **Un módulo a la vez.** No mezclar módulos en una misma sesión.
5. **Validación en backend siempre.** No confiar solo en validaciones del frontend.
6. **Manejo de errores explícito.** Todos los endpoints deben retornar errores con código HTTP correcto y mensaje claro.
7. **Nombres descriptivos.** Variables, funciones y endpoints deben ser autoexplicativos.
8. **Archivos modulares.** Evitar archivos de más de 200 líneas. Si crece, dividir en servicios.
9. **Comentarios en lógica de negocio crítica.** Especialmente en el cálculo de estados de acceso y la lógica del molinete.
10. **Cada sesión = una tarea.** Abrir nueva sesión de chat al cambiar de módulo o funcionalidad.
11. **Todo PR debe indicar si fue generado con asistencia de IA** para que el Tech Lead audite con mayor detención.

---

## VARIABLES DE ENTORNO REQUERIDAS (.env.example)

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/cefide

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development

# Molinete (proceso local)
COM_PORT_MOLINETE_1=COM1
COM_PORT_MOLINETE_2=COM2
COM_SERVICE_URL_1=http://localhost:3001
COM_SERVICE_URL_2=http://localhost:3002
COM_PULSE_MS=500

# Config por defecto
DEFAULT_CLASES_GRACIA=2
DEFAULT_DIA_VENCIMIENTO=5
```

---

*Prompt generado en base al relevamiento técnico completo del Gimnasio CEFIDE (abril–mayo 2026) y las guías de desarrollo Fullmindtech.*
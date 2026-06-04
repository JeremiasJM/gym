import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Config global del sistema
  await prisma.configSistema.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      clasesGracia: 2,
      diaVencimiento: 5,
    },
  });
  console.log('✓ ConfigSistema');

  // Usuario ADMIN (no vinculado a profesor)
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@cefide.com' },
    update: {},
    create: {
      email: 'admin@cefide.com',
      password: adminPassword,
      rol: Rol.ADMIN,
    },
  });
  console.log('✓ Usuario admin (admin@cefide.com / admin123)');

  // Profesor de prueba
  const profesor = await prisma.profesor.upsert({
    where: { dni: '12345678' },
    update: {},
    create: {
      dni: '12345678',
      nombre: 'Juan',
      apellido: 'Pérez',
    },
  });

  const profePassword = await bcrypt.hash('profe123', 10);
  await prisma.usuario.upsert({
    where: { email: 'juan@cefide.com' },
    update: {},
    create: {
      email: 'juan@cefide.com',
      password: profePassword,
      rol: Rol.PROFESOR,
      profesorId: profesor.id,
    },
  });
  console.log('✓ Profesor Juan Pérez (juan@cefide.com / profe123)');

  // Alumno con clases y pago al día (estado VERDE)
  await prisma.alumno.upsert({
    where: { dni: '40111222' },
    update: {},
    create: {
      dni: '40111222',
      nombre: 'Martín',
      apellido: 'González',
      activo: true,
      profesorId: profesor.id,
      clasesTotal: 12,
      clasesUsadas: 5,
      pagado: true,
      fechaPago: new Date(),
    },
  });
  console.log('✓ Alumno Martín González (DNI 40111222) — VERDE, 7 clases restantes');

  // Alumno sin pago pero con clases de gracia (estado AMARILLO)
  await prisma.alumno.upsert({
    where: { dni: '40333444' },
    update: {},
    create: {
      dni: '40333444',
      nombre: 'Lucía',
      apellido: 'Ramírez',
      activo: true,
      profesorId: profesor.id,
      clasesTotal: 8,
      clasesUsadas: 6,
      pagado: false,
      fechaPago: null,
    },
  });
  console.log('✓ Alumno Lucía Ramírez (DNI 40333444) — AMARILLO, sin pago, 2 clases gracia');

  // Alumno bloqueado sin clases (estado ROJO)
  await prisma.alumno.upsert({
    where: { dni: '40555666' },
    update: {},
    create: {
      dni: '40555666',
      nombre: 'Diego',
      apellido: 'Fernández',
      activo: true,
      profesorId: profesor.id,
      clasesTotal: 8,
      clasesUsadas: 8,
      pagado: false,
      fechaPago: null,
    },
  });
  console.log('✓ Alumno Diego Fernández (DNI 40555666) — ROJO, sin clases ni pago');

  // Alumno inactivo
  await prisma.alumno.upsert({
    where: { dni: '40777888' },
    update: {},
    create: {
      dni: '40777888',
      nombre: 'Sofía',
      apellido: 'López',
      activo: false,
      profesorId: profesor.id,
      clasesTotal: 0,
      clasesUsadas: 0,
      pagado: false,
      fechaPago: null,
    },
  });
  console.log('✓ Alumno Sofía López (DNI 40777888) — INACTIVA');

  console.log('\nSeed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

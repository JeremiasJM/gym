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

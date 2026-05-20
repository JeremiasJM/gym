import { PrismaClient } from '@prisma/client';

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

  console.log('Seed completado: ConfigSistema creada');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Module } from '@nestjs/common';
import { ActividadesService } from './actividades.service';
import { ActividadesController } from './actividades.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActividadesController],
  providers: [ActividadesService],
  exports: [ActividadesService],
})
export class ActividadesModule {}

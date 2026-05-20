import { Module } from '@nestjs/common';
import { IngresosService } from './ingresos.service';
import { IngresosController } from './ingresos.controller';

@Module({
  controllers: [IngresosController],
  providers: [IngresosService],
  exports: [IngresosService],
})
export class IngresosModule {}

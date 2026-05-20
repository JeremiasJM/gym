import { Module } from '@nestjs/common';
import { AccesoService } from './acceso.service';
import { AccesoController } from './acceso.controller';
import { MolineteModule } from '../molinete/molinete.module';

@Module({
  imports: [MolineteModule],
  controllers: [AccesoController],
  providers: [AccesoService],
  exports: [AccesoService],
})
export class AccesoModule {}

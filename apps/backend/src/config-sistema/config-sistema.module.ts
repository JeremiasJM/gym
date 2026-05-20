import { Module } from '@nestjs/common';
import { ConfigSistemaService } from './config-sistema.service';
import { ConfigSistemaController } from './config-sistema.controller';
import { RenovacionCron } from './renovacion.cron';
import { AlumnosModule } from '../alumnos/alumnos.module';

@Module({
  imports: [AlumnosModule],
  controllers: [ConfigSistemaController],
  providers: [ConfigSistemaService, RenovacionCron],
  exports: [ConfigSistemaService],
})
export class ConfigSistemaModule {}

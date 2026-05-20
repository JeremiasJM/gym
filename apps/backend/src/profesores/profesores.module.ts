import { Module } from '@nestjs/common';
import { ProfesoresService } from './profesores.service';
import { ProfesoresController } from './profesores.controller';

@Module({
  controllers: [ProfesoresController],
  providers: [ProfesoresService],
  exports: [ProfesoresService],
})
export class ProfesoresModule {}

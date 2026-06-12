import { IsString, IsEnum } from 'class-validator';
import { Frecuencia } from '@prisma/client';

export class CreateInscripcionDto {
  @IsString()
  alumnoId: string;

  @IsString()
  actividadId: string;

  @IsEnum(Frecuencia)
  frecuencia: Frecuencia;
}

import { IsEnum } from 'class-validator';
import { Frecuencia } from '@prisma/client';

export class CambiarFrecuenciaDto {
  @IsEnum(Frecuencia)
  frecuencia: Frecuencia;
}

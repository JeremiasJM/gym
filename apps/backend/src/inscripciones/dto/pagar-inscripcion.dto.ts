import { IsBoolean } from 'class-validator';

export class PagarInscripcionDto {
  @IsBoolean()
  pagado: boolean;
}

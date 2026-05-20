import { IsBoolean } from 'class-validator';

export class RegistrarPagoDto {
  @IsBoolean()
  pagado: boolean;
}

import { IsInt, Min } from 'class-validator';

export class AgregarClasesDto {
  @IsInt()
  @Min(1)
  clases: number;
}

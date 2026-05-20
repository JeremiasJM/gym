import { IsInt, Min } from 'class-validator';

export class AsignarClasesDto {
  @IsInt()
  @Min(1)
  clasesTotal: number;
}

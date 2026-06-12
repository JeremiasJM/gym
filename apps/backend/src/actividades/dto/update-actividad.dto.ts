import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class UpdateActividadDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

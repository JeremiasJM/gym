import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateAlumnoDto {
  @IsString()
  @MinLength(7)
  @MaxLength(8)
  dni: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @IsString()
  @MinLength(2)
  apellido: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateAlumnoDto {
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(8)
  dni?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  apellido?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

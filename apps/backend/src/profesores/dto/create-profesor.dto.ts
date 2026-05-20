import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateProfesorDto {
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
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

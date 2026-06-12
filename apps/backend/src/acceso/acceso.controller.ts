import { Controller, Post, Body } from '@nestjs/common';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { AccesoService } from './acceso.service';
import { MolineteService } from '../molinete/molinete.service';
import { EstadoIngreso } from '@prisma/client';

class ConsultarAccesoDto {
  @IsString()
  dni: string;
}

class ValidarAccesoDto {
  @IsString()
  dni: string;

  @IsOptional()
  @IsString()
  inscripcionId?: string;

  @IsOptional()
  @IsInt()
  molinete?: number;
}

@Controller('acceso')
export class AccesoController {
  constructor(
    private readonly accesoService: AccesoService,
    private readonly molineteService: MolineteService,
  ) {}

  /**
   * POST /api/acceso/consultar
   * Paso 1: busca el alumno y devuelve sus inscripciones activas.
   * No registra ingreso ni abre molinete.
   */
  @Post('consultar')
  consultar(@Body() dto: ConsultarAccesoDto) {
    return this.accesoService.consultarAcceso(dto.dni);
  }

  /**
   * POST /api/acceso/validar
   * Paso 2: valida la inscripción seleccionada, registra ingreso y abre molinete.
   */
  @Post('validar')
  async validar(@Body() dto: ValidarAccesoDto) {
    const molineteNum = dto.molinete ?? 1;
    const inscripcionId = dto.inscripcionId ?? null;

    const resultado = await this.accesoService.validarAcceso(dto.dni, inscripcionId);

    await this.accesoService.registrarIngreso(
      dto.dni,
      inscripcionId,
      resultado.estado,
      molineteNum,
    );

    let molineteResponse = null;
    if (resultado.estado !== EstadoIngreso.ROJO) {
      molineteResponse = await this.molineteService.abrir(molineteNum);
    }

    return { ...resultado, molinete: molineteResponse };
  }
}

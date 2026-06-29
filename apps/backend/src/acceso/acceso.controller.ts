import { Controller, Post, Get, Body } from '@nestjs/common';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { AccesoService } from './acceso.service';

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
  constructor(private readonly accesoService: AccesoService) {}

  /**
   * GET /api/acceso/config
   * Config pública para el kiosco: tiempos de pantalla por estado (segundos).
   * No requiere auth — el kiosco corre sin sesión.
   */
  @Get('config')
  config() {
    return this.accesoService.getKioscoConfig();
  }

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
   * Paso 2: valida la inscripción seleccionada y registra el ingreso.
   *
   * La apertura física la dispara el navegador del kiosco contra su driver
   * local (localhost). El backend en la nube NO puede alcanzar el molinete.
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

    return resultado;
  }
}

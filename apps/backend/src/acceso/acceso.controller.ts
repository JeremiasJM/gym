import { Controller, Post, Body } from '@nestjs/common';
import { AccesoService } from './acceso.service';
import { MolineteService } from '../molinete/molinete.service';
import { EstadoIngreso } from '@prisma/client';

class ValidarAccesoDto {
  dni: string;
  molinete?: number;
}

@Controller('acceso')
export class AccesoController {
  constructor(
    private readonly accesoService: AccesoService,
    private readonly molineteService: MolineteService,
  ) {}

  /**
   * POST /api/acceso/validar
   * Endpoint público (usado por terminal kiosco)
   * 1. Valida acceso (VERDE/AMARILLO/ROJO)
   * 2. Registra ingreso en DB
   * 3. Si acceso concedido (VERDE/AMARILLO), envía señal al molinete
   */
  @Post('validar')
  async validar(@Body() dto: ValidarAccesoDto) {
    const molineteNum = dto.molinete ?? 1;
    const resultado = await this.accesoService.validarAcceso(dto.dni);

    // Registrar ingreso independientemente del estado
    await this.accesoService.registrarIngreso(
      dto.dni,
      resultado.estado,
      molineteNum,
    );

    // Si acceso concedido, abrir molinete
    let molineteResponse = null;
    if (resultado.estado !== EstadoIngreso.ROJO) {
      molineteResponse = await this.molineteService.abrir(molineteNum);
    }

    return {
      ...resultado,
      molinete: molineteResponse,
    };
  }
}

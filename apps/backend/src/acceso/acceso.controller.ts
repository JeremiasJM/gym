import { Controller, Post, Body } from '@nestjs/common';
import { AccesoService } from './acceso.service';

class ValidarAccesoDto {
  dni: string;
  molinete?: number;
}

@Controller('acceso')
export class AccesoController {
  constructor(private readonly accesoService: AccesoService) {}

  /**
   * POST /api/acceso/validar
   * Endpoint público (usado por terminal kiosco)
   * Valida acceso y registra ingreso
   */
  @Post('validar')
  async validar(@Body() dto: ValidarAccesoDto) {
    const resultado = await this.accesoService.validarAcceso(dto.dni);

    // Registrar ingreso independientemente del estado
    await this.accesoService.registrarIngreso(
      dto.dni,
      resultado.estado,
      dto.molinete ?? 1,
    );

    return resultado;
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MolineteService } from './molinete.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoIngreso } from '@prisma/client';

@Controller('molinete')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN)
export class MolineteController {
  constructor(
    private readonly molineteService: MolineteService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /api/molinete/:num/contingencia
   * Botón de contingencia: abre molinete sin importar estado del alumno
   * Solo ADMIN puede usar esto
   */
  @Post(':num/contingencia')
  async contingencia(
    @Param('num', ParseIntPipe) num: number,
    @Body() body: { dni?: string; motivo?: string },
  ) {
    const resultado = await this.molineteService.abrir(num);

    // Registrar ingreso de contingencia si viene DNI
    if (body.dni) {
      const alumno = await this.prisma.alumno.findUnique({
        where: { dni: body.dni },
      });

      if (alumno) {
        await this.prisma.ingreso.create({
          data: {
            alumnoId: alumno.id,
            estado: EstadoIngreso.VERDE,
            molinete: num,
          },
        });
      }
    }

    return {
      ...resultado,
      contingencia: true,
      molinete: num,
      motivo: body.motivo || 'Apertura de contingencia',
    };
  }

  /**
   * GET /api/molinete/:num/status
   * Estado del driver de un molinete
   */
  @Get(':num/status')
  status(@Param('num', ParseIntPipe) num: number) {
    return this.molineteService.status(num);
  }
}

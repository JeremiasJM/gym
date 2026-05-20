import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Rol } from '@prisma/client';

interface AuthUser {
  id: string;
  rol: Rol;
  profesorId: string | null;
}

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('actividad')
  reporteActividad(
    @Req() req: Request,
    @Query('profesorId') profesorId?: string,
  ) {
    const user = req.user as AuthUser;
    const filterProfesorId =
      user.rol === Rol.PROFESOR ? user.profesorId! : profesorId;

    return this.reportesService.reporteActividad(filterProfesorId);
  }

  @Get('actividad/csv')
  @Roles(Rol.ADMIN)
  async exportCsv(
    @Res() res: Response,
    @Query('profesorId') profesorId?: string,
  ) {
    const datos = await this.reportesService.reporteActividad(profesorId);
    const csv = this.reportesService.generarCsv(datos);

    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte-cefide-${fecha}.csv"`,
    );
    res.send(csv);
  }
}

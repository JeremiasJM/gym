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
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(
    private readonly reportesService: ReportesService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Get('pagos')
  @Roles(Rol.ADMIN)
  async historialPagos(
    @Query('search') search?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.alumno = {
        OR: [
          { dni: { contains: search } },
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) {
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);
        where.fecha.lte = hastaDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.pago.findMany({
        where,
        include: {
          alumno: {
            select: { dni: true, nombre: true, apellido: true },
          },
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.pago.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}

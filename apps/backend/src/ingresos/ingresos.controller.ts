import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { IngresosService } from './ingresos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EstadoIngreso, Rol } from '@prisma/client';

interface AuthUser {
  id: string;
  rol: Rol;
  profesorId: string | null;
}

@Controller('ingresos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IngresosController {
  constructor(private readonly ingresosService: IngresosService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('alumnoId') alumnoId?: string,
    @Query('profesorId') profesorId?: string,
    @Query('estado') estado?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as AuthUser;

    // Profesor solo ve ingresos de sus alumnos
    const filterProfesorId =
      user.rol === Rol.PROFESOR ? user.profesorId! : profesorId;

    return this.ingresosService.findAll({
      desde,
      hasta,
      alumnoId,
      profesorId: filterProfesorId,
      estado: estado as EstadoIngreso | undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }
}

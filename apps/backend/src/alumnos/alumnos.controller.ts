import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AlumnosService } from './alumnos.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';
import { AsignarClasesDto } from './dto/asignar-clases.dto';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Rol } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  rol: Rol;
  profesorId: string | null;
}

@Controller('alumnos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('profesorId') profesorId?: string,
    @Query('activo') activo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as AuthUser;

    // Profesor solo ve sus alumnos
    const filterProfesorId =
      user.rol === Rol.PROFESOR ? user.profesorId! : profesorId;

    return this.alumnosService.findAll({
      search,
      profesorId: filterProfesorId,
      activo: activo !== undefined ? activo === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as AuthUser;
    const alumno = await this.alumnosService.findOne(id);

    // Profesor solo puede ver sus propios alumnos
    if (user.rol === Rol.PROFESOR && alumno.profesorId !== user.profesorId) {
      throw new ForbiddenException('No autorizado a ver este alumno');
    }

    return alumno;
  }

  @Post()
  @Roles(Rol.ADMIN)
  create(@Body() dto: CreateAlumnoDto) {
    return this.alumnosService.create(dto);
  }

  @Put(':id')
  @Roles(Rol.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAlumnoDto) {
    return this.alumnosService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(Rol.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.alumnosService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(Rol.ADMIN)
  activate(@Param('id') id: string) {
    return this.alumnosService.activate(id);
  }

  @Patch(':id/clases')
  @Roles(Rol.ADMIN)
  asignarClases(@Param('id') id: string, @Body() dto: AsignarClasesDto) {
    return this.alumnosService.asignarClases(id, dto.clasesTotal);
  }

  @Patch(':id/pago')
  @Roles(Rol.ADMIN)
  registrarPago(@Param('id') id: string, @Body() dto: RegistrarPagoDto) {
    return this.alumnosService.registrarPago(id, dto.pagado);
  }
}

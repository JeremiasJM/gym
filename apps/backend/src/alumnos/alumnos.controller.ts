import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlumnosService } from './alumnos.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Rol } from '@prisma/client';

@Controller('alumnos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('activo') activo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.alumnosService.findAll({
      search,
      activo: activo !== undefined ? activo === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alumnosService.findOne(id);
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
}

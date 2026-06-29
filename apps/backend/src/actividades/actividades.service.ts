import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';

@Injectable()
export class ActividadesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(soloActivas?: boolean, profesorId?: string) {
    const where: Record<string, unknown> = {};
    if (soloActivas) where.activo = true;
    if (profesorId) where.profesores = { some: { id: profesorId } };

    return this.prisma.actividad.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { _count: { select: { inscripciones: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id },
      include: { _count: { select: { inscripciones: true } } },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    return actividad;
  }

  async create(dto: CreateActividadDto) {
    const exists = await this.prisma.actividad.findUnique({
      where: { nombre: dto.nombre },
    });
    if (exists) throw new ConflictException('Ya existe una actividad con ese nombre');
    return this.prisma.actividad.create({ data: dto });
  }

  async update(id: string, dto: UpdateActividadDto) {
    await this.findOne(id);
    if (dto.nombre) {
      const exists = await this.prisma.actividad.findFirst({
        where: { nombre: dto.nombre, NOT: { id } },
      });
      if (exists) throw new ConflictException('Ya existe una actividad con ese nombre');
    }
    return this.prisma.actividad.update({ where: { id }, data: dto });
  }
}

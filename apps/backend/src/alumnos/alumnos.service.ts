import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';

interface FindAllParams {
  search?: string;
  profesorId?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class AlumnosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const { search, profesorId, activo, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { dni: { contains: search } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (profesorId) {
      where.profesorId = profesorId;
    }

    if (activo !== undefined) {
      where.activo = activo;
    }

    const [data, total] = await Promise.all([
      this.prisma.alumno.findMany({
        where,
        include: {
          profesor: { select: { id: true, nombre: true, apellido: true } },
        },
        orderBy: { apellido: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.alumno.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const alumno = await this.prisma.alumno.findUnique({
      where: { id },
      include: {
        profesor: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }

    return alumno;
  }

  async create(dto: CreateAlumnoDto) {
    const exists = await this.prisma.alumno.findUnique({
      where: { dni: dto.dni },
    });

    if (exists) {
      throw new ConflictException('Ya existe un alumno con ese DNI');
    }

    return this.prisma.alumno.create({
      data: dto,
      include: {
        profesor: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  async update(id: string, dto: UpdateAlumnoDto) {
    await this.findOne(id);

    // Si cambia DNI, verificar unicidad
    if (dto.dni) {
      const exists = await this.prisma.alumno.findFirst({
        where: { dni: dto.dni, NOT: { id } },
      });
      if (exists) {
        throw new ConflictException('Ya existe un alumno con ese DNI');
      }
    }

    return this.prisma.alumno.update({
      where: { id },
      data: dto,
      include: {
        profesor: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.alumno.update({
      where: { id },
      data: { activo: false },
    });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.alumno.update({
      where: { id },
      data: { activo: true },
    });
  }

  async asignarClases(id: string, clasesTotal: number) {
    await this.findOne(id);
    return this.prisma.alumno.update({
      where: { id },
      data: { clasesTotal, clasesUsadas: 0 },
      include: {
        profesor: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  async registrarPago(id: string, pagado: boolean) {
    await this.findOne(id);
    return this.prisma.alumno.update({
      where: { id },
      data: {
        pagado,
        fechaPago: pagado ? new Date() : null,
      },
      include: {
        profesor: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  /**
   * Renovación mensual: reset clases usadas y estado de pago
   * Se ejecuta vía cron el lunes siguiente al día 30/31
   */
  async renovacionMensual() {
    const result = await this.prisma.alumno.updateMany({
      where: { activo: true },
      data: {
        clasesUsadas: 0,
        pagado: false,
        fechaPago: null,
      },
    });

    return { renovados: result.count };
  }
}

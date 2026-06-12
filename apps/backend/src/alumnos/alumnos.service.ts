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
  activo?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class AlumnosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const { search, activo, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { dni: { contains: search } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activo !== undefined) {
      where.activo = activo;
    }

    const [data, total] = await Promise.all([
      this.prisma.alumno.findMany({
        where,
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
        inscripciones: {
          include: { actividad: true },
          orderBy: { actividad: { nombre: 'asc' } },
        },
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

    return this.prisma.alumno.create({ data: dto });
  }

  async update(id: string, dto: UpdateAlumnoDto) {
    await this.findOne(id);

    if (dto.dni) {
      const exists = await this.prisma.alumno.findFirst({
        where: { dni: dto.dni, NOT: { id } },
      });
      if (exists) {
        throw new ConflictException('Ya existe un alumno con ese DNI');
      }
    }

    return this.prisma.alumno.update({ where: { id }, data: dto });
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

  async renovacionMensual(): Promise<{ renovados: number }> {
    const config = await this.prisma.configSistema.findUnique({ where: { id: 'global' } });
    const clasesPorFrecuencia: Record<string, number> = {
      UNA_VEZ:    config?.clasesUnaVez    ?? 5,
      DOS_VECES:  config?.clasesDosVeces  ?? 9,
      TRES_VECES: config?.clasesTresVeces ?? 13,
      LIBRE:      config?.clasesLibre     ?? 30,
    };

    const inscripciones = await this.prisma.inscripcionActividad.findMany({
      where: { alumno: { activo: true } },
      select: { id: true, frecuencia: true },
    });

    await Promise.all(
      inscripciones.map((ins) =>
        this.prisma.inscripcionActividad.update({
          where: { id: ins.id },
          data: {
            clasesUsadas: 0,
            pagado: false,
            clasesTotal: clasesPorFrecuencia[ins.frecuencia] ?? 5,
          },
        }),
      ),
    );

    return { renovados: inscripciones.length };
  }
}

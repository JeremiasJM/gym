import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfesorDto } from './dto/create-profesor.dto';

@Injectable()
export class ProfesoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.profesor.findMany({
      include: {
        _count: { select: { alumnos: true } },
        usuario: { select: { id: true, email: true } },
      },
      orderBy: { apellido: 'asc' },
    });
  }

  async findOne(id: string) {
    const profesor = await this.prisma.profesor.findUnique({
      where: { id },
      include: {
        _count: { select: { alumnos: true } },
        usuario: { select: { id: true, email: true } },
      },
    });

    if (!profesor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    return profesor;
  }

  async create(dto: CreateProfesorDto) {
    const exists = await this.prisma.profesor.findUnique({
      where: { dni: dto.dni },
    });

    if (exists) {
      throw new ConflictException('Ya existe un profesor con ese DNI');
    }

    const { email, password, ...profesorData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const profesor = await tx.profesor.create({
        data: profesorData,
      });

      // Si viene email+password, crear usuario vinculado
      if (email && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await tx.usuario.create({
          data: {
            email,
            password: hashedPassword,
            rol: 'PROFESOR',
            profesorId: profesor.id,
          },
        });
      }

      return this.findOne(profesor.id);
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Verificar que no tenga alumnos asignados
    const count = await this.prisma.alumno.count({
      where: { profesorId: id },
    });

    if (count > 0) {
      throw new ConflictException(
        `No se puede eliminar: tiene ${count} alumno(s) asignado(s)`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Eliminar usuario vinculado si existe
      await tx.usuario.deleteMany({ where: { profesorId: id } });
      return tx.profesor.delete({ where: { id } });
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ReporteAlumno {
  dni: string;
  nombre: string;
  apellido: string;
  profesor: string;
  clasesTotal: number;
  clasesUsadas: number;
  clasesRestantes: number;
  pagado: boolean;
  fechaPago: Date | null;
  activo: boolean;
}

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async reporteActividad(profesorId?: string): Promise<ReporteAlumno[]> {
    const where: Record<string, unknown> = { activo: true };
    if (profesorId) where.profesorId = profesorId;

    const alumnos = await this.prisma.alumno.findMany({
      where,
      include: {
        profesor: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    return alumnos.map((a) => ({
      dni: a.dni,
      nombre: a.nombre,
      apellido: a.apellido,
      profesor: a.profesor ? `${a.profesor.apellido}, ${a.profesor.nombre}` : 'Sin asignar',
      clasesTotal: a.clasesTotal,
      clasesUsadas: a.clasesUsadas,
      clasesRestantes: a.clasesTotal - a.clasesUsadas,
      pagado: a.pagado,
      fechaPago: a.fechaPago,
      activo: a.activo,
    }));
  }

  generarCsv(datos: ReporteAlumno[]): string {
    const headers = [
      'DNI',
      'Apellido',
      'Nombre',
      'Profesor',
      'Clases Total',
      'Clases Realizadas',
      'Clases Restantes',
      'Pagado',
      'Fecha Pago',
    ];

    const rows = datos.map((d) => [
      d.dni,
      d.apellido,
      d.nombre,
      d.profesor,
      d.clasesTotal,
      d.clasesUsadas,
      d.clasesRestantes,
      d.pagado ? 'Sí' : 'No',
      d.fechaPago ? new Date(d.fechaPago).toLocaleDateString('es-AR') : '',
    ]);

    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    return bom + [headers, ...rows].map((r) => r.join(';')).join('\n');
  }
}

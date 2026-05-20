import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoIngreso } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// DNIs comodín: siempre pasan en VERDE (dueño, profesores)
const DNIS_COMODIN = ['00000000', '99999999'];

export interface ResultadoAcceso {
  estado: EstadoIngreso;
  alumno: {
    nombre: string;
    apellido: string;
    dni: string;
  };
  clasesRestantes: number;
  clasesGraciaRestantes: number;
  mensaje: string;
}

@Injectable()
export class AccesoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lógica central de acceso — determina estado VERDE/AMARILLO/ROJO
   *
   * VERDE:    pagado Y tiene clases disponibles
   * AMARILLO: no pagó PERO tiene clases de gracia disponibles
   * ROJO:     sin clases de gracia O sin pago después del vencimiento
   */
  async validarAcceso(dni: string): Promise<ResultadoAcceso> {
    // DNI comodín: siempre VERDE
    if (DNIS_COMODIN.includes(dni)) {
      return {
        estado: EstadoIngreso.VERDE,
        alumno: { nombre: 'ACCESO', apellido: 'AUTORIZADO', dni },
        clasesRestantes: 999,
        clasesGraciaRestantes: 0,
        mensaje: 'Acceso libre',
      };
    }

    const alumno = await this.prisma.alumno.findUnique({
      where: { dni },
    });

    if (!alumno) {
      throw new NotFoundException('DNI no registrado');
    }

    if (!alumno.activo) {
      return {
        estado: EstadoIngreso.ROJO,
        alumno: { nombre: alumno.nombre, apellido: alumno.apellido, dni },
        clasesRestantes: 0,
        clasesGraciaRestantes: 0,
        mensaje: 'Alumno inactivo — acceso bloqueado',
      };
    }

    const config = await this.prisma.configSistema.findUnique({
      where: { id: 'global' },
    });
    const clasesGraciaMax = config?.clasesGracia ?? 2;

    const clasesRestantes = alumno.clasesTotal - alumno.clasesUsadas;

    // Sin clases restantes → ROJO directo
    if (clasesRestantes <= 0) {
      return {
        estado: EstadoIngreso.ROJO,
        alumno: { nombre: alumno.nombre, apellido: alumno.apellido, dni },
        clasesRestantes: 0,
        clasesGraciaRestantes: 0,
        mensaje: 'Sin clases disponibles — acceso bloqueado',
      };
    }

    // Pagado y tiene clases → VERDE
    if (alumno.pagado) {
      return {
        estado: EstadoIngreso.VERDE,
        alumno: { nombre: alumno.nombre, apellido: alumno.apellido, dni },
        clasesRestantes,
        clasesGraciaRestantes: 0,
        mensaje: `Acceso permitido — ${clasesRestantes} clase(s) restante(s)`,
      };
    }

    // No pagó: calcular clases de gracia usadas este período
    // Clases de gracia = ingresos AMARILLO desde último pago o inicio de mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ingresosGracia = await this.prisma.ingreso.count({
      where: {
        alumnoId: alumno.id,
        estado: EstadoIngreso.AMARILLO,
        fechaHora: { gte: inicioMes },
      },
    });

    const clasesGraciaRestantes = clasesGraciaMax - ingresosGracia;

    // Tiene clases de gracia disponibles → AMARILLO
    if (clasesGraciaRestantes > 0) {
      return {
        estado: EstadoIngreso.AMARILLO,
        alumno: { nombre: alumno.nombre, apellido: alumno.apellido, dni },
        clasesRestantes,
        clasesGraciaRestantes,
        mensaje: `Acceso con gracia — ${clasesGraciaRestantes} clase(s) de gracia restante(s). Regularizar pago.`,
      };
    }

    // Sin clases de gracia → ROJO
    return {
      estado: EstadoIngreso.ROJO,
      alumno: { nombre: alumno.nombre, apellido: alumno.apellido, dni },
      clasesRestantes,
      clasesGraciaRestantes: 0,
      mensaje: 'Sin clases de gracia — regularizar pago para acceder',
    };
  }

  /**
   * Registrar ingreso en DB y descontar clase si corresponde
   */
  async registrarIngreso(
    dni: string,
    estado: EstadoIngreso,
    molinete: number = 1,
  ) {
    const alumno = await this.prisma.alumno.findUnique({ where: { dni } });

    if (!alumno) return;
    if (DNIS_COMODIN.includes(dni)) {
      // Registrar ingreso comodín sin descontar clases
      return this.prisma.ingreso.create({
        data: { alumnoId: alumno.id, estado, molinete },
      });
    }

    // Registrar ingreso y descontar clase en transacción
    return this.prisma.$transaction(async (tx) => {
      const ingreso = await tx.ingreso.create({
        data: { alumnoId: alumno.id, estado, molinete },
      });

      // Solo descontar si acceso fue concedido (VERDE o AMARILLO)
      if (estado !== EstadoIngreso.ROJO) {
        await tx.alumno.update({
          where: { id: alumno.id },
          data: { clasesUsadas: { increment: 1 } },
        });
      }

      return ingreso;
    });
  }
}

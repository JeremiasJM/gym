import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlumnosService } from '../alumnos/alumnos.service';

/**
 * Renovación mensual automática
 * Se ejecuta todos los lunes a las 03:00 AM
 * Solo renueva si estamos en la primera semana del mes (después del día 28 del mes anterior)
 */
@Injectable()
export class RenovacionCron {
  private readonly logger = new Logger(RenovacionCron.name);

  constructor(
    private readonly alumnosService: AlumnosService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async handleRenovacion() {
    const hoy = new Date();
    const diaDelMes = hoy.getDate();

    // Solo ejecutar la primera semana del mes (días 1-7)
    if (diaDelMes > 7) {
      return;
    }

    // Verificar que no se haya renovado ya este mes
    const config = await this.prisma.configSistema.findUnique({
      where: { id: 'global' },
    });

    const diaVencimiento = config?.diaVencimiento ?? 5;

    // Solo ejecutar si pasó el día de vencimiento
    if (diaDelMes < diaVencimiento) {
      return;
    }

    this.logger.log('Ejecutando renovación mensual...');
    const resultado = await this.alumnosService.renovacionMensual();
    this.logger.log(`Renovación completada: ${resultado.renovados} alumnos renovados`);
  }
}

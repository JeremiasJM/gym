import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AlumnosModule } from './alumnos/alumnos.module';
import { ProfesoresModule } from './profesores/profesores.module';
import { AccesoModule } from './acceso/acceso.module';
import { ConfigSistemaModule } from './config-sistema/config-sistema.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    AlumnosModule,
    ProfesoresModule,
    AccesoModule,
    ConfigSistemaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

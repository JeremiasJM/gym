import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigSistemaService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    let config = await this.prisma.configSistema.findUnique({
      where: { id: 'global' },
    });

    if (!config) {
      config = await this.prisma.configSistema.create({
        data: { id: 'global', clasesGracia: 2, diaVencimiento: 5 },
      });
    }

    return config;
  }

  async update(data: { clasesGracia?: number; diaVencimiento?: number }) {
    return this.prisma.configSistema.update({
      where: { id: 'global' },
      data,
    });
  }
}

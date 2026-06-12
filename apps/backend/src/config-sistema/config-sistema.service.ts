import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface UpdateConfigDto {
  clasesGracia?: number;
  diaVencimiento?: number;
  clasesUnaVez?: number;
  clasesDosVeces?: number;
  clasesTresVeces?: number;
  clasesLibre?: number;
}

@Injectable()
export class ConfigSistemaService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    let config = await this.prisma.configSistema.findUnique({
      where: { id: 'global' },
    });

    if (!config) {
      config = await this.prisma.configSistema.create({
        data: {
          id: 'global',
          clasesGracia: 2,
          diaVencimiento: 5,
          clasesUnaVez: 5,
          clasesDosVeces: 9,
          clasesTresVeces: 13,
          clasesLibre: 30,
        },
      });
    }

    return config;
  }

  async update(data: UpdateConfigDto) {
    return this.prisma.configSistema.update({
      where: { id: 'global' },
      data,
    });
  }
}

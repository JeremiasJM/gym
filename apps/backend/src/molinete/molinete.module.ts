import { Module } from '@nestjs/common';
import { MolineteService } from './molinete.service';
import { MolineteController } from './molinete.controller';

@Module({
  controllers: [MolineteController],
  providers: [MolineteService],
  exports: [MolineteService],
})
export class MolineteModule {}

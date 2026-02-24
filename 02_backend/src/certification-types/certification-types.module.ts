import { Module } from '@nestjs/common';
import { CertificationTypesService } from './certification-types.service';
import { CertificationTypesController } from './certification-types.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CertificationTypesController],
  providers: [CertificationTypesService, PrismaService],
  exports: [CertificationTypesService],
})
export class CertificationTypesModule {}

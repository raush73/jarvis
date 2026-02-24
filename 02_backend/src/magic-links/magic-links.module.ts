import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MagicLinksService } from './magic-links.service';

@Module({
  imports: [PrismaModule],
  providers: [MagicLinksService],
  exports: [MagicLinksService],
})
export class MagicLinksModule {}

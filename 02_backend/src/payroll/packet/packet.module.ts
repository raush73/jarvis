import { Module } from '@nestjs/common';
import { PacketController } from './packet.controller';
import { PacketService } from './packet.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Payroll Packet v1 Module
 *
 * Provides payroll packet generation and CSV export functionality.
 */
@Module({
  controllers: [PacketController],
  providers: [PacketService, PrismaService],
  exports: [PacketService],
})
export class PacketModule {}


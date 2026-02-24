import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BurdenSnapshotGuard {
  constructor(private readonly prisma: PrismaService) {}

  async assertNoBurdenSnapshot(invoiceId: string) {
    const existing = await this.prisma.invoiceTradeMarginSnapshot.findUnique({
      where: { invoiceId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'Burden snapshot already exists for this invoice and is immutable.',
      );
    }
  }
}

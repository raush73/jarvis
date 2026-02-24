import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceRecipientsService } from '../invoices/invoice-recipients.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const prisma = app.get(PrismaService);
  const svc = app.get(InvoiceRecipientsService);

  const inv = await prisma.invoice.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      customerId: true,
      orderId: true,
      createdAt: true,
      order: { select: { locationId: true } },
    },
  });

  if (!inv) {
    console.log('NO_INVOICE_FOUND');
    await app.close();
    return;
  }

  const resolved = await svc.resolveForInvoice(inv.id);

  console.log(
    JSON.stringify(
      {
        invoice: {
          id: inv.id,
          customerId: inv.customerId,
          orderId: inv.orderId,
          locationId: inv.order?.locationId ?? null,
          createdAt: inv.createdAt,
        },
        resolved,
      },
      null,
      2,
    ),
  );

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


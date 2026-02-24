import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as path from 'path';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PERMISSIONS } from '../auth/permissions.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerApproveHoursDto } from './dto/customer-approve-hours.dto';
import { readHtml, injectWindowData } from '../ui/internal/ui-html.util';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('customer-portal')
@Permissions(PERMISSIONS.CUSTOMER_PORTAL_ACCESS)
export class CustomerPortalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerPortalService: CustomerPortalService,
  ) {}

  @Get('health')
  health() {
    return { ok: true, scope: 'customer' };
  }

  @Permissions(PERMISSIONS.ORDERS_READ_CUSTOMER)
  @Get('orders')
  async getOrders(@Req() req: any) {
    const userId = req.user?.sub ?? req.user?.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customerId: true },
    });

    if (!user?.customerId) {
      throw new ForbiddenException('Customer scope not configured for this user');
    }

    const orders = await this.prisma.order.findMany({
      where: { customerId: user.customerId },
      orderBy: { createdAt: 'desc' },
    });

    return { ok: true, value: orders };
  }

  @Permissions(PERMISSIONS.HOURS_READ_CUSTOMER)
  @Get('orders/:orderId/hours')
  async getOrderHours(@Req() req: any, @Param('orderId') orderId: string) {
    const userId = req.user?.sub ?? req.user?.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customerId: true },
    });

    if (!user?.customerId) {
      throw new ForbiddenException('Customer scope not configured for this user');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customerId: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== user.customerId) {
      throw new ForbiddenException('Access denied to this order');
    }

    // Customer display: OFFICIAL hours as rows: Employee | Project/PO | Hours
    // NOTE: Project/PO is NOT Location.name. Until projectRef exists on hours lines, we return null.
    const hoursEntries = await this.prisma.hoursEntry.findMany({
      where: { orderId, type: 'OFFICIAL' },
      select: {
        id: true,
        workerId: true,
        periodStart: true,
        periodEnd: true,
        totalHours: true,
        approvalStatus: true,
        enteredBy: true,
      },
      orderBy: [{ periodStart: 'asc' }, { workerId: 'asc' }],
    });

    const workerIds = Array.from(new Set(hoursEntries.map((h) => h.workerId)));
    const workers = workerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: workerIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];

    const workerNameById = new Map<string, string>();
    for (const w of workers) {
      const name = (w.fullName ?? '').trim();
      workerNameById.set(w.id, name || w.id);
    }

    const value = hoursEntries.map((h) => ({
      hoursEntryId: h.id,
      workerId: h.workerId,
      employeeName: workerNameById.get(h.workerId) ?? h.workerId,
      projectRef: null, // UI should render (Unspecified Project/PO) until stored in DB
      periodStart: h.periodStart,
      periodEnd: h.periodEnd,
      approvalStatus: h.approvalStatus,
      enteredBy: h.enteredBy,
      hours: h.totalHours,
    }));

    return { ok: true, orderId, value };
  }

  @Permissions(PERMISSIONS.HOURS_APPROVE_CUSTOMER)
  @Post('hours/:hoursEntryId/approve')
  async approveHours(
    @Req() req: any,
    @Param('hoursEntryId') hoursEntryId: string,
    @Body() dto: CustomerApproveHoursDto,
  ) {
    const userId = req.user?.sub ?? req.user?.userId;

    const updated = await this.customerPortalService.approveHoursEntry({
      userId,
      hoursEntryId,
      decision: dto.decision,
      rejectionReason: dto.rejectionReason,
    });

    return { ok: true, value: updated };
  }

  // -------------------------------
  // Phase 14 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Customer Invoices (READ-ONLY)
  // -------------------------------

  @Permissions(PERMISSIONS.INVOICES_READ_CUSTOMER)
  @Get('invoices')
  async getInvoices(@Req() req: any) {
    const userId = req.user?.sub ?? req.user?.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customerId: true },
    });

    if (!user?.customerId) {
      throw new ForbiddenException('Customer scope not configured for this user');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { order: { customerId: user.customerId } },
      select: {
        id: true,
        orderId: true,
        status: true,
        issuedAt: true,
        subtotalAmountCents: true,
        totalAmountCents: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { ok: true, value: invoices };
  }

  @Permissions(PERMISSIONS.INVOICES_READ_CUSTOMER)
  @Get('invoices/:invoiceId')
  async getInvoice(@Req() req: any, @Param('invoiceId') invoiceId: string) {
    const userId = req.user?.sub ?? req.user?.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customerId: true },
    });

    if (!user?.customerId) {
      throw new ForbiddenException('Customer scope not configured for this user');
    }

    // Access is enforced IN the query (no post-fetch customerId checks)
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        order: { customerId: user.customerId },
      },
      select: {
        id: true,
        orderId: true,
        status: true,
        issuedAt: true,
        subtotalAmountCents: true,
        totalAmountCents: true,
        createdAt: true,
        updatedAt: true,
        lineItems: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitRateCents: true,
            lineTotalCents: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return { ok: true, value: invoice };
  }

  // Out of Phase 14 scope ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â explicitly disabled
  @Permissions(PERMISSIONS.PAYMENTS_READ_CUSTOMER)
  @Get('payments')
  async getPayments() {
    throw new NotFoundException('Not found');
  }

  // -------------------------------
  // UI-15 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Approved Timesheet Snapshot (READ-ONLY, Customer-Scoped)
  // -------------------------------

  @Permissions(PERMISSIONS.HOURS_READ_CUSTOMER)
  @Get('orders/:orderId/timesheets/approved-snapshot')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async renderApprovedTimesheetSnapshot(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Query('weekStart') weekStart?: string,
  ): Promise<string> {
    // 1) Extract userId from JWT
    const userId = req.user?.sub ?? req.user?.userId;

    // 2) Load user.customerId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customerId: true },
    });

    if (!user?.customerId) {
      throw new ForbiddenException('Customer scope not configured for this user');
    }

    // 3) Load order and enforce customer scoping
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customerId: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== user.customerId) {
      throw new ForbiddenException('Access denied to this order');
    }

    // 4) Validate weekStart
    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      throw new BadRequestException('Invalid weekStart');
    }

    const periodStart = new Date(`${weekStart}T00:00:00.000Z`);
    if (isNaN(periodStart.getTime())) {
      throw new BadRequestException('Invalid weekStart');
    }

    const periodEndExclusive = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 5) Query approved OFFICIAL entries (READ-ONLY)
    const entries = await this.prisma.hoursEntry.findMany({
      where: {
        orderId,
        type: 'OFFICIAL',
        approvalStatus: 'APPROVED',
        AND: [
          { periodEnd: { gt: periodStart } },
          { periodStart: { lt: periodEndExclusive } },
        ],
      },
      select: { workerId: true, totalHours: true },
    });

    // 6) If zero approved entries => 404
    if (entries.length === 0) {
      throw new NotFoundException('Approved timesheet snapshot not found');
    }

    // 7) Deterministic order + sanitized labels
    const sorted = [...entries].sort((a, b) => a.workerId.localeCompare(b.workerId));
    const items = sorted.map((e, idx) => ({
      workerLabel: `Worker ${idx + 1}`,
      totalHours: typeof e.totalHours === 'number' ? e.totalHours : 0,
    }));

    const totalWorkers = items.length;
    const totalHours = items.reduce((sum, item) => sum + item.totalHours, 0);

    // Week ending Sunday = periodStart + 6 days
    const weekEndingSunday = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    const periodStartDisplay = periodStart.toISOString().slice(0, 10);
    const periodEndDisplay = weekEndingSunday.toISOString().slice(0, 10);

    // 8) Build window.__DATA__
    const data = {
      orderId,
      periodStart: periodStartDisplay,
      periodEnd: periodEndDisplay,
      items,
      totalWorkers,
      totalHours,
    };

    // 9) Read and inject template
    const filePath = path.join(__dirname, 'templates/ui15-approved-snapshot.html');
    const html = readHtml(filePath);
    return injectWindowData(html, data);
  }

  // -------------------------------
  // UI-16 ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Customer Invoice Snapshot (READ-ONLY, Issued Only)
  // -------------------------------

  @Permissions(PERMISSIONS.INVOICES_READ_CUSTOMER)
  @Get('ui16/invoice/:invoiceId')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async renderInvoiceSnapshot(
    @Req() req: any,
    @Param('invoiceId') invoiceId: string,
  ): Promise<string> {
    // 1) Extract userId from JWT
    const userId = req.user?.sub ?? req.user?.userId;

    // 2) Load user.customerId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customerId: true },
    });

    if (!user?.customerId) {
      throw new ForbiddenException('Customer scope not configured for this user');
    }

    // 3) Load invoice with snapshot
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        customerId: true,
        status: true,
        issuedSnapshotJson: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // 4) Enforce customer scoping
    if (invoice.customerId !== user.customerId) {
      throw new NotFoundException('Invoice not found');
    }

    // 5) Must be ISSUED with snapshot
    if (invoice.status !== 'ISSUED' || !invoice.issuedSnapshotJson) {
      throw new NotFoundException('Invoice not found');
    }

    // 6) Parse snapshot (read-only, no recomputation)
    const snapshot = invoice.issuedSnapshotJson as any;

    // 7) Sanitize worker identity (Worker 1..N) in approvedHoursEntries
    const workerIdMap = new Map<string, number>();
    let workerIndex = 0;

    const sanitizedHoursEntries = (snapshot.approvedHoursEntries || []).map((entry: any) => {
      if (!workerIdMap.has(entry.workerId)) {
        workerIndex++;
        workerIdMap.set(entry.workerId, workerIndex);
      }
      return {
        ...entry,
        workerLabel: `Worker ${workerIdMap.get(entry.workerId)}`,
        workerId: undefined, // Remove actual workerId from output
      };
    });

    // 8) Build window.__DATA__
    const data = {
      invoiceId: snapshot.invoiceId,
      invoiceNumber: snapshot.invoiceNumber,
      issuedAt: snapshot.issuedAt,
      customer: snapshot.customer,
      lineItems: snapshot.lineItems || [],
      approvedHoursEntries: sanitizedHoursEntries,
      subtotalAmountCents: snapshot.subtotalAmountCents,
      totalAmountCents: snapshot.totalAmountCents,
    };

    // 9) Read and inject template
    const filePath = path.join(__dirname, 'templates/ui16-invoice.html');
    const html = readHtml(filePath);
    return injectWindowData(html, data);
  }
}

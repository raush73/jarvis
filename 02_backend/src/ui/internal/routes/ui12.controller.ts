import { Controller, Get, Header, Query } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { readHtml, injectWindowData } from '../ui-html.util';
import { Roles } from '../../../auth/authz/authz.decorators';

/**
 * UI-12: Internal Recruiting Visibility
 *
 * READ-ONLY page. No database writes. No mutations.
 * Displays OrderCandidate and OrderVetting records for an Order.
 *
 * Route: GET /ui/internal/ui12/recruiting?orderId=<id>
 * - orderId: Order identifier
 */
@Controller('ui/internal/ui12')
export class Ui12Controller {
  constructor(private readonly prisma: PrismaService) {}

  @Get('recruiting')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async renderRecruitingPage(
    @Query('orderId') orderId?: string,
  ): Promise<string> {
    const filePath = path.join(__dirname, '../templates/ui12-recruiting.html');
    const html = readHtml(filePath);

    // If orderId missing, return static HTML (placeholder state)
    if (!orderId) {
      return html;
    }

    try {
      // READ-ONLY: Fetch Order by id
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          customerId: true,
          status: true,
          createdAt: true,
          jobLocationCode: true,
        },
      });

      if (!order) {
        return injectWindowData(html, {
          error: true,
          errorMessage: 'Order not found',
        });
      }

      // READ-ONLY: Fetch OrderCandidate records for this Order
      const orderCandidates = await this.prisma.orderCandidate.findMany({
        where: { orderId },
        select: {
          id: true,
          employeeId: true,
          status: true,
          createdAt: true,
          vettings: {
            select: {
              id: true,
              status: true,
              holdReason: true,
              notes: true,
              reviewedAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Map candidates to output format
      const candidates = orderCandidates.map((c) => ({
        candidateId: c.id,
        employeeId: c.employeeId,
        status: c.status,
        createdAt: c.createdAt ? c.createdAt.toISOString().slice(0, 10) : null,
      }));

      // Flatten vettings from all candidates, including employeeId for reference
      const vettings: Array<{
        vettingId: string;
        employeeId: string;
        status: string;
        decisionReason: string | null;
        decidedAt: string | null;
      }> = [];

      for (const c of orderCandidates) {
        for (const v of c.vettings) {
          vettings.push({
            vettingId: v.id,
            employeeId: c.employeeId,
            status: v.status,
            decisionReason: v.holdReason || v.notes || null,
            decidedAt: v.reviewedAt ? v.reviewedAt.toISOString().slice(0, 10) : null,
          });
        }
      }

      const data = {
        order: {
          id: order.id,
          customerId: order.customerId,
          status: order.status,
          createdAt: order.createdAt.toISOString().slice(0, 10),
          jobLocationCode: order.jobLocationCode,
        },
        candidates,
        vettings,
        totalCandidates: candidates.length,
        totalVettings: vettings.length,
      };

      return injectWindowData(html, data);
    } catch {
      return html;
    }
  }
}

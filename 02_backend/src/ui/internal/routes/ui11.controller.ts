import { Controller, Get, Header, Query } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { readHtml, injectWindowData } from '../ui-html.util';
import { Roles } from '../../../auth/authz/authz.decorators';

/**
 * UI-11: Order Assignments Viewer
 *
 * READ-ONLY page. No database writes. No mutations.
 * Displays Order header and associated Assignments.
 *
 * Route: GET /ui/internal/ui11/orders-assignments?orderId=<id>
 * - orderId: Order identifier
 */
@Controller('ui/internal/ui11')
export class Ui11Controller {
  constructor(private readonly prisma: PrismaService) {}

  @Get('orders-assignments')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async renderOrdersAssignmentsPage(
    @Query('orderId') orderId?: string,
  ): Promise<string> {
    const filePath = path.join(__dirname, '../templates/ui11-orders-assignments.html');
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

      // READ-ONLY: Fetch Assignments for this Order
      const assignments = await this.prisma.assignment.findMany({
        where: { orderId },
        select: {
          id: true,
          userId: true,
          status: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { startDate: 'asc' },
      });

      // Map assignments to output format
      const items = assignments.map((a) => ({
        id: a.id,
        employeeId: a.userId,
        status: a.status,
        startDate: a.startDate ? a.startDate.toISOString().slice(0, 10) : null,
        endDate: a.endDate ? a.endDate.toISOString().slice(0, 10) : null,
      }));

      const data = {
        order: {
          id: order.id,
          customerId: order.customerId,
          status: order.status,
          createdAt: order.createdAt.toISOString().slice(0, 10),
          jobLocationCode: order.jobLocationCode,
        },
        assignments: items,
        totalAssignments: items.length,
      };

      return injectWindowData(html, data);
    } catch {
      return html;
    }
  }
}


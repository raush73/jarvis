import { Controller, Get, Post, Body, Header, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { readHtml, injectWindowData } from '../ui-html.util';
import { Roles } from '../../../auth/authz/authz.decorators';
import { Ui13VettingService, VettingAction } from '../services/ui13-vetting.service';

/**
 * UI-13: Recruiting Vetting Action
 *
 * READ-ONLY (GET shell + data)
 *
 * Route:
 *   GET /ui/internal/ui13/vetting-action?orderId=<id>&employeeId=<id>
 *   GET /ui/internal/ui13/audit-history?orderId=<id>&employeeId=<id>
 */
@Controller('ui/internal/ui13')
export class Ui13Controller {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vettingService: Ui13VettingService,
  ) {}

  @Get('vetting-action')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async renderVettingActionPage(
    @Query('orderId') orderId?: string,
    @Query('employeeId') employeeId?: string,
  ): Promise<string> {
    const filePath = path.join(__dirname, '../templates/ui13-vetting-action.html');
    const html = readHtml(filePath);

    if (!orderId || !employeeId) {
      return injectWindowData(html, {
        placeholder: true,
        previewOnly: true,
        message: 'Provide orderId and employeeId to view vetting recommendation (preview-only).',
      });
    }

    // Fetch order
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
        previewOnly: true,
        errorMessage: 'Order not found',
      });
    }

    // Fetch candidate
    const candidate = await this.prisma.orderCandidate.findFirst({
      where: { orderId, employeeId },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    if (!candidate) {
      return injectWindowData(html, {
        error: true,
        previewOnly: true,
        errorMessage: 'Candidate not found for this order',
        order,
        context: { orderId, employeeId },
      });
    }

    // Fetch vetting
    const vetting = await this.prisma.orderVetting.findFirst({
      where: { orderCandidateId: candidate.id },
      select: {
        id: true,
        status: true,
        holdReason: true,
        notes: true,
        reviewedAt: true,
      },
    });

    if (!vetting) {
      return injectWindowData(html, {
        error: true,
        previewOnly: true,
        errorMessage: 'No vetting record found for this candidate',
        order,
        context: { orderId, employeeId },
        candidate,
      });
    }

    // Fetch latest audit record for inline display (Wave F)
    let latestAudit: {
      id: string;
      action: string;
      previousStatus: string;
      newStatus: string;
      reason: string | null;
      performedByUserId: string;
      createdAt: Date;
    } | null = null;
    if (vetting.id) {
      const audits = await this.prisma.orderVettingAudit.findMany({
        where: { orderVettingId: vetting.id },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          action: true,
          previousStatus: true,
          newStatus: true,
          reason: true,
          performedByUserId: true,
          createdAt: true,
        },
      });
      if (audits.length > 0) {
        latestAudit = audits[0];
      }
    }

    return injectWindowData(html, {
      order,
      context: { orderId, employeeId },
      candidate,
      vetting,
      latestAudit,
      placeholder: false,
      previewOnly: true,
    });
  }

  /**
   * Wave G: Audit History Endpoint
   *
   * GET /ui/internal/ui13/audit-history?orderId=<id>&employeeId=<id>
   *
   * Returns audit records for the candidate, newest first.
   * Optional filters: action, userId, startDate, endDate
   * Optional export: format=json|csv (default: html)
   */
  @Get('audit-history')
  @Roles('admin')
  async getAuditHistory(
    @Query('orderId') orderId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('action') actionFilter?: string,
    @Query('userId') userIdFilter?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ): Promise<void> {
    // Validate required params
    if (!orderId || !employeeId) {
      if (format === 'json') {
        res!.setHeader('Content-Type', 'application/json; charset=utf-8');
        res!.status(400).send(JSON.stringify({
          error: true,
          errorMessage: 'orderId and employeeId are required',
        }));
        return;
      }
      if (format === 'csv') {
        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.status(400).send('Error: orderId and employeeId are required');
        return;
      }
      // Default: HTML
      const filePath = path.join(__dirname, '../templates/ui13-audit-history.html');
      const html = readHtml(filePath);
      res!.setHeader('Content-Type', 'text/html; charset=utf-8');
      res!.send(injectWindowData(html, {
        error: true,
        previewOnly: true,
        errorMessage: 'orderId and employeeId are required',
      }));
      return;
    }

    // Fetch audit history via service
    const audits = await this.vettingService.getAuditHistoryByCandidate(orderId, employeeId);

    // Apply optional filters
    let filteredAudits = audits;

    if (actionFilter) {
      filteredAudits = filteredAudits.filter(a => a.action === actionFilter);
    }

    if (userIdFilter) {
      filteredAudits = filteredAudits.filter(a => a.performedByUserId === userIdFilter);
    }

    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        filteredAudits = filteredAudits.filter(a => new Date(a.createdAt) >= start);
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        filteredAudits = filteredAudits.filter(a => new Date(a.createdAt) <= end);
      }
    }

    // Export: JSON
    if (format === 'json') {
      res!.setHeader('Content-Type', 'application/json; charset=utf-8');
      res!.send(JSON.stringify({
        orderId,
        employeeId,
        totalRecords: filteredAudits.length,
        audits: filteredAudits,
      }, null, 2));
      return;
    }

    // Export: CSV
    if (format === 'csv') {
      res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res!.setHeader('Content-Disposition', `attachment; filename="audit-history-${orderId}-${employeeId}.csv"`);

      const csvHeaders = ['id', 'orderVettingId', 'orderCandidateId', 'action', 'previousStatus', 'newStatus', 'reason', 'performedByUserId', 'createdAt'];
      const csvRows = [csvHeaders.join(',')];

      for (const a of filteredAudits) {
        const row = [
          a.id,
          a.orderVettingId,
          a.orderCandidateId,
          a.action,
          a.previousStatus,
          a.newStatus,
          a.reason ? `"${a.reason.replace(/"/g, '""')}"` : '',
          a.performedByUserId,
          a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
        ];
        csvRows.push(row.join(','));
      }

      res!.send(csvRows.join('\n'));
      return;
    }

    // Default: HTML
    const filePath = path.join(__dirname, '../templates/ui13-audit-history.html');
    const html = readHtml(filePath);
    res!.setHeader('Content-Type', 'text/html; charset=utf-8');
    res!.send(injectWindowData(html, {
      orderId,
      employeeId,
      audits: filteredAudits,
      totalRecords: filteredAudits.length,
      filters: { action: actionFilter, userId: userIdFilter, startDate, endDate },
      previewOnly: true,
    }));
  }

  @Post('vetting-action')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async handleVettingAction(
    @Body() body: {
      orderId?: string;
      employeeId?: string;
      action?: 'APPROVE' | 'REJECT' | 'HOLD';
      reason?: string;
      userId?: string;
      previewOnly?: boolean;
    },
  ): Promise<string> {
    const filePath = path.join(__dirname, '../templates/ui13-vetting-action.html');
    const html = readHtml(filePath);

    const { orderId, employeeId, action, reason, userId, previewOnly } = body;

    // Basic validation
    if (!orderId || !employeeId || !action) {
      return injectWindowData(html, {
        error: true,
        previewOnly: true,
        errorMessage: 'Missing required fields.',
      });
    }

    if ((action === 'REJECT' || action === 'HOLD') && !reason) {
      return injectWindowData(html, {
        error: true,
        previewOnly: true,
        errorMessage: 'Reason is required for REJECT and HOLD.',
        context: { orderId, employeeId },
      });
    }

    // Fetch candidate for validation
    const candidate = await this.prisma.orderCandidate.findFirst({
      where: { orderId, employeeId },
      select: { id: true },
    });

    if (!candidate) {
      return injectWindowData(html, {
        error: true,
        previewOnly: true,
        errorMessage: 'Candidate not found.',
        context: { orderId, employeeId },
      });
    }

    // Fetch vetting for validation
    const vetting = await this.prisma.orderVetting.findFirst({
      where: { orderCandidateId: candidate.id },
    });

    if (!vetting) {
      return injectWindowData(html, {
        error: true,
        previewOnly: true,
        errorMessage: 'Vetting record not found.',
        context: { orderId, employeeId },
      });
    }

    // Preview-only mode: validate without mutation
    if (previewOnly) {
      // Idempotent no-ops
      if (
        (action === 'APPROVE' && vetting.status === 'APPROVED') ||
        (action === 'REJECT' && vetting.status === 'REJECTED') ||
        (action === 'HOLD' && vetting.status === 'VETTING_HOLD')
      ) {
        return injectWindowData(html, {
          success: true,
          previewOnly: true,
          message: `Vetting already in target status. No change would be made.`,
          context: { orderId, employeeId },
          vetting,
        });
      }

      // Conflict blocking
      if (vetting.status === 'APPROVED' || vetting.status === 'REJECTED') {
        return injectWindowData(html, {
          error: true,
          previewOnly: true,
          errorMessage: 'This vetting is locked and cannot be changed.',
          context: { orderId, employeeId },
        });
      }

      return injectWindowData(html, {
        success: true,
        previewOnly: true,
        message: 'Validation passed. Preview-only mode. No database writes occurred.',
        context: { orderId, employeeId },
        vetting,
      });
    }

    // Mutation mode: requires userId
    if (!userId) {
      return injectWindowData(html, {
        error: true,
        previewOnly: false,
        errorMessage: 'userId is required for mutations.',
        context: { orderId, employeeId },
      });
    }

    // Perform mutation via service
    try {
      const result = await this.vettingService.updateVettingStatus(
        orderId,
        employeeId,
        action as VettingAction,
        reason,
        userId,
      );

      return injectWindowData(html, {
        success: true,
        previewOnly: false,
        message: result.message,
        context: { orderId, employeeId },
        vetting: result.vetting,
        auditId: result.auditId,
      });
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      return injectWindowData(html, {
        error: true,
        previewOnly: false,
        errorMessage: err.message || 'An error occurred while updating vetting status.',
        context: { orderId, employeeId },
      });
    }
  }
}

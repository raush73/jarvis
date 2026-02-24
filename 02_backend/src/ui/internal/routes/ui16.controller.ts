import { Controller, Get, Header, Query, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { readHtml, injectWindowData } from '../ui-html.util';
import { Roles } from '../../../auth/authz/authz.decorators';
import {
  demoCandidates,
  getDemoCandidateById,
  getDemoCandidateSummaries,
  DemoCandidateDetail,
} from '../demo/ui16-demo.data';

/**
 * Check if demo mode is enabled via environment variable.
 */
function isDemoMode(): boolean {
  const val = process.env.UI_DEMO_MODE;
  return val === 'true' || val === '1';
}

/**
 * Check if error is a Prisma connection error (P1001 = Can't reach database).
 */
function isDbConnectionError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    return code === 'P1001' || code === 'P1002' || code === 'P1003' || code === 'P1008' || code === 'P1017';
  }
  return false;
}

/**
 * UI-16: Recruiter Candidate Profile Tabs
 *
 * Internal UI page for recruiters to view candidate profiles with tabs:
 * 1) Snapshot (At-a-Glance)
 * 2) Fit (Skills & Work Profile)
 * 3) Readiness (Dispatch Gates summary + block reasons)
 * 4) Certifications (authoritative list)
 * 5) Compliance (status-only)
 * 6) Notes & History (append-only view)
 * 7) Documents (storage view)
 *
 * Routes:
 *   GET /ui/internal/ui16                        - Candidate list
 *   GET /ui/internal/ui16/candidate/:id          - Candidate profile
 *   GET /ui/internal/ui16/candidate-profile?candidateId=<id>  - Legacy profile route
 */
@Controller('ui/internal/ui16')
export class Ui16Controller {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // DEMO-PUBLIC ROUTES (no @Roles - accessible when UI_DEMO_MODE=true)
  // =========================================================================

  /**
   * GET /ui/internal/ui16 - Demo-public candidate list view
   * Available without auth when UI_DEMO_MODE=true (non-production only).
   */
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async renderCandidateListDemoPublic(@Res() res: Response): Promise<void> {
    if (!isDemoMode() || process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    const filePath = path.join(__dirname, '../templates/ui16-candidate-list.html');
    const html = readHtml(filePath);
    const data = {
      demoMode: true,
      candidates: getDemoCandidateSummaries(),
    };
    const injectedHtml = injectWindowData(html, data);
    res.status(200).send(injectedHtml);
  }

  /**
   * GET /ui/internal/ui16/candidate/:id - Demo-public candidate profile by ID
   * Available without auth when UI_DEMO_MODE=true (non-production only).
   */
  @Get('candidate/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async renderCandidateProfileByIdDemoPublic(
    @Param('id') candidateId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!isDemoMode() || process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.renderDemoCandidateProfile(candidateId, res);
  }

  /**
   * GET /ui/internal/ui16/candidate-profile?candidateId=<id> - Demo-public legacy route
   * Available without auth when UI_DEMO_MODE=true (non-production only).
   */
  @Get('candidate-profile')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async renderCandidateProfileDemoPublic(
    @Query('candidateId') candidateId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    if (!isDemoMode() || process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    if (!candidateId || typeof candidateId !== 'string' || candidateId.trim() === '') {
      const errorHtml = this.buildErrorHtml(400, 'Bad Request', 'Missing required query parameter: candidateId');
      res!.status(400).send(errorHtml);
      return;
    }
    return this.renderDemoCandidateProfile(candidateId.trim(), res!);
  }

  // =========================================================================
  // SECURE ROUTES (protected by @Roles('admin'))
  // =========================================================================

  /**
   * GET /ui/internal/ui16/secure - Secure candidate list view
   */
  @Get('secure')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async renderCandidateList(@Res() res: Response): Promise<void> {
    const filePath = path.join(__dirname, '../templates/ui16-candidate-list.html');
    const html = readHtml(filePath);

    // DEMO MODE: Return static demo candidates
    if (isDemoMode()) {
      const data = {
        demoMode: true,
        candidates: getDemoCandidateSummaries(),
      };
      const injectedHtml = injectWindowData(html, data);
      res.status(200).send(injectedHtml);
      return;
    }

    // PRODUCTION MODE: Query real database
    try {
      const candidates = await this.prisma.candidate.findMany({
        select: {
          id: true,
          email: true,
          phone: true,
          status: true,
          candidateTrades: {
            include: { trade: { select: { name: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      // Map to summary format (Candidate schema lacks name/location fields)
      const summaries = candidates.map((c) => ({
        id: c.id,
        fullName: c.email ?? c.phone ?? `Candidate ${c.id.slice(-6)}`,
        trade: c.candidateTrades[0]?.trade?.name ?? 'Not specified',
        homeCityState: 'Not available',
        status: c.status ?? 'Unknown',
      }));

      // EMPTY STATE: No candidates in database
      if (summaries.length === 0) {
        const data = {
          demoMode: false,
          candidates: [],
        };
        const injectedHtml = injectWindowData(html, data);
        res.status(200).send(injectedHtml);
        return;
      }

      const data = {
        demoMode: false,
        candidates: summaries,
      };
      const injectedHtml = injectWindowData(html, data);
      res.status(200).send(injectedHtml);
    } catch (err) {
      // ERROR STATE: Database unreachable
      if (isDbConnectionError(err)) {
        const errorHtml = this.buildDbUnavailableHtml();
        res.status(503).send(errorHtml);
        return;
      }
      // Re-throw other errors to be handled by NestJS exception filter
      throw err;
    }
  }

  /**
   * GET /ui/internal/ui16/secure/candidate/:id - Secure candidate profile by ID param
   */
  @Get('secure/candidate/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async renderCandidateProfileById(
    @Param('id') candidateId: string,
    @Res() res: Response,
  ): Promise<void> {
    return this.renderCandidateProfileInternal(candidateId, res);
  }

  /**
   * GET /ui/internal/ui16/secure/candidate-profile?candidateId=<id> - Secure legacy route with query param
   */
  @Get('secure/candidate-profile')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Roles('admin')
  async renderCandidateProfile(
    @Query('candidateId') candidateId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    // 400 - Missing candidateId
    if (!candidateId || typeof candidateId !== 'string' || candidateId.trim() === '') {
      const errorHtml = this.buildErrorHtml(400, 'Bad Request', 'Missing required query parameter: candidateId');
      res!.status(400).send(errorHtml);
      return;
    }
    return this.renderCandidateProfileInternal(candidateId.trim(), res!);
  }

  // =========================================================================
  // INTERNAL HELPERS
  // =========================================================================

  /**
   * Render demo candidate profile (used by demo-public routes).
   */
  private async renderDemoCandidateProfile(candidateId: string, res: Response): Promise<void> {
    const filePath = path.join(__dirname, '../templates/ui16-candidate-profile.html');
    const html = readHtml(filePath);
    const trimmedId = candidateId.trim();

    const demoCandidate = getDemoCandidateById(trimmedId);
    if (!demoCandidate) {
      const errorHtml = this.buildErrorHtml(404, 'Not Found', `Demo candidate with id "${trimmedId}" not found.`);
      res.status(404).send(errorHtml);
      return;
    }
    const data = this.buildDemoProfileData(demoCandidate);
    const injectedHtml = injectWindowData(html, data);
    res.status(200).send(injectedHtml);
  }

  /**
   * Internal method to render candidate profile (shared by both routes).
   */
  private async renderCandidateProfileInternal(candidateId: string, res: Response): Promise<void> {
    const filePath = path.join(__dirname, '../templates/ui16-candidate-profile.html');
    const html = readHtml(filePath);

    const trimmedId = candidateId.trim();

    // DEMO MODE: Return static demo candidate
    if (isDemoMode()) {
      const demoCandidate = getDemoCandidateById(trimmedId);
      if (!demoCandidate) {
        const errorHtml = this.buildErrorHtml(404, 'Not Found', `Demo candidate with id "${trimmedId}" not found.`);
        res.status(404).send(errorHtml);
        return;
      }
      const data = this.buildDemoProfileData(demoCandidate);
      const injectedHtml = injectWindowData(html, data);
      res.status(200).send(injectedHtml);
      return;
    }

    // PRODUCTION MODE: Query real database
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: trimmedId },
        include: {
          candidateTrades: {
            include: { trade: { select: { id: true, name: true } } },
          },
          candidateTools: {
            include: { toolType: { select: { id: true, name: true } } },
          },
          candidatePpe: {
            include: { ppeType: { select: { id: true, name: true } } },
          },
          candidateCerts: {
            include: { certType: { select: { id: true, code: true, name: true } } },
          },
        },
      });

      // 404 - Candidate not found
      if (!candidate) {
        const errorHtml = this.buildErrorHtml(404, 'Not Found', `Candidate with id "${trimmedId}" not found.`);
        res.status(404).send(errorHtml);
        return;
      }

      // Build data for each tab
      const data = this.buildRealProfileData(candidate);
      const injectedHtml = injectWindowData(html, data);
      res.status(200).send(injectedHtml);
    } catch (err) {
      // ERROR STATE: Database unreachable
      if (isDbConnectionError(err)) {
        const errorHtml = this.buildDbUnavailableHtml();
        res.status(503).send(errorHtml);
        return;
      }
      // Re-throw other errors
      throw err;
    }
  }

  /**
   * Build profile data from a demo candidate fixture.
   */
  private buildDemoProfileData(demo: DemoCandidateDetail) {
    const now = new Date();
    const createdAt = '2024-01-01T00:00:00.000Z';
    const updatedAt = now.toISOString();

    // Snapshot
    const snapshot = {
      id: demo.id,
      status: demo.status,
      phone: demo.phone,
      email: demo.email,
      createdAt,
      updatedAt,
    };

    // Fit (simplified for demo)
    const fit = {
      trades: [{ tradeName: demo.trade, proficiency: 'JOURNEYMAN', source: 'DEMO', notes: null }],
      tools: [],
      ppe: [],
    };

    // Readiness
    const hardBlockReasons: string[] = [];
    let hardBlockStatus = 'PASS';
    const statusUpper = demo.status.toUpperCase();
    if (statusUpper === 'INACTIVE' || statusUpper === 'DO_NOT_DISPATCH' || statusUpper === 'DO NOT DISPATCH') {
      hardBlockStatus = 'FAIL';
      hardBlockReasons.push(`Candidate status is "${demo.status}"`);
    }

    const certGateReasons: string[] = [];
    let certGateStatus = 'PASS';
    for (const cert of demo.certs) {
      if (cert.expiresAt && new Date(cert.expiresAt) < now) {
        certGateStatus = 'FAIL';
        certGateReasons.push(`Certification "${cert.name}" (${cert.code}) expired on ${cert.expiresAt}`);
      }
    }
    if (demo.certs.length === 0) {
      certGateStatus = 'UNKNOWN';
      certGateReasons.push('No certifications on file');
    }

    const complianceGateReasons: string[] = [];
    let complianceGateStatus = 'PASS';
    for (const flag of demo.complianceFlags) {
      if (flag.status !== 'COMPLETE' && flag.status !== 'CLEARED') {
        complianceGateStatus = 'FAIL';
        complianceGateReasons.push(`${flag.type}: ${flag.status}`);
      }
    }

    let overallStatus = 'READY';
    if (hardBlockStatus === 'FAIL' || certGateStatus === 'FAIL' || complianceGateStatus === 'FAIL') {
      overallStatus = 'BLOCKED';
    } else if (hardBlockStatus === 'UNKNOWN' || certGateStatus === 'UNKNOWN') {
      overallStatus = 'UNKNOWN';
    }

    const readiness = {
      overallStatus,
      hardBlock: { status: hardBlockStatus, reasons: hardBlockReasons },
      certGate: { status: certGateStatus, reasons: certGateReasons },
      complianceGate: { status: complianceGateStatus, reasons: complianceGateReasons },
    };

    // Certifications
    const certifications = demo.certs.map((c) => ({
      certTypeId: c.code,
      certCode: c.code,
      certName: c.name,
      status: c.status,
      verification: c.verification,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      notes: null,
      source: 'DEMO',
    }));

    // Compliance
    const complianceMap: Record<string, string> = {};
    for (const flag of demo.complianceFlags) {
      complianceMap[flag.type] = flag.status;
    }
    const compliance = {
      i9Status: complianceMap['I-9'] ?? 'Not available',
      w4Status: complianceMap['W-4'] ?? 'Not available',
      backgroundCheckStatus: complianceMap['BACKGROUND'] ?? 'Not available',
      drugScreenStatus: complianceMap['DRUG_SCREEN'] ?? 'Not available',
    };

    // Notes & Documents (empty for demo)
    const notesHistory = { notes: [], placeholder: demo.notes || 'No notes available' };
    const documents = { documents: [], placeholder: 'No documents available' };

    return {
      candidateId: demo.id,
      snapshot,
      fit,
      readiness,
      certifications,
      compliance,
      notesHistory,
      documents,
    };
  }

  /**
   * Build profile data from a real Prisma candidate record.
   */
  private buildRealProfileData(candidate: {
    id: string;
    status: string | null;
    phone: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    candidateTrades: Array<{
      tradeId: string;
      trade: { id: string; name: string };
      proficiency: string;
      notes: string | null;
      source: string;
    }>;
    candidateTools: Array<{
      toolTypeId: string;
      toolType: { id: string; name: string };
      status: string;
      notes: string | null;
      source: string;
    }>;
    candidatePpe: Array<{
      ppeTypeId: string;
      ppeType: { id: string; name: string };
      status: string;
      notes: string | null;
      source: string;
    }>;
    candidateCerts: Array<{
      certTypeId: string;
      certType: { id: string; code: string; name: string };
      status: string;
      verification: string;
      issuedAt: Date | null;
      expiresAt: Date | null;
      notes: string | null;
      source: string;
    }>;
  }) {
    // TAB 1: Snapshot
    const snapshot = {
      id: candidate.id,
      status: candidate.status ?? 'Unknown',
      phone: candidate.phone ?? null,
      email: candidate.email ?? null,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
    };

    // TAB 2: Fit
    const trades = candidate.candidateTrades.map((ct) => ({
      tradeId: ct.tradeId,
      tradeName: ct.trade.name,
      proficiency: ct.proficiency,
      notes: ct.notes ?? null,
      source: ct.source,
    }));

    const tools = candidate.candidateTools.map((ct) => ({
      toolTypeId: ct.toolTypeId,
      toolName: ct.toolType.name,
      status: ct.status,
      notes: ct.notes ?? null,
      source: ct.source,
    }));

    const ppe = candidate.candidatePpe.map((cp) => ({
      ppeTypeId: cp.ppeTypeId,
      ppeName: cp.ppeType.name,
      status: cp.status,
      notes: cp.notes ?? null,
      source: cp.source,
    }));

    const fit = { trades, tools, ppe };

    // TAB 3: Readiness
    const readiness = this.computeReadiness(candidate);

    // TAB 4: Certifications
    const certifications = candidate.candidateCerts.map((cc) => ({
      certTypeId: cc.certTypeId,
      certCode: cc.certType.code,
      certName: cc.certType.name,
      status: cc.status,
      verification: cc.verification,
      issuedAt: cc.issuedAt ? cc.issuedAt.toISOString() : null,
      expiresAt: cc.expiresAt ? cc.expiresAt.toISOString() : null,
      notes: cc.notes ?? null,
      source: cc.source,
    }));

    // TAB 5: Compliance
    const compliance = {
      i9Status: 'Not available',
      w4Status: 'Not available',
      backgroundCheckStatus: 'Not available',
      drugScreenStatus: 'Not available',
    };

    // TAB 6: Notes & History
    const notesHistory = { notes: [], placeholder: 'No notes available' };

    // TAB 7: Documents
    const documents = { documents: [], placeholder: 'No documents available' };

    return {
      candidateId: candidate.id,
      snapshot,
      fit,
      readiness,
      certifications,
      compliance,
      notesHistory,
      documents,
    };
  }

  /**
   * Compute readiness summary with hard blocks, cert gate, and compliance gate.
   */
  private computeReadiness(candidate: {
    status: string | null;
    candidateCerts: Array<{
      status: string;
      expiresAt: Date | null;
      certType: { code: string; name: string };
    }>;
  }): {
    overallStatus: string;
    hardBlock: { status: string; reasons: string[] };
    certGate: { status: string; reasons: string[] };
    complianceGate: { status: string; reasons: string[] };
  } {
    const hardBlockReasons: string[] = [];
    const certGateReasons: string[] = [];
    const complianceGateReasons: string[] = [];

    // Hard blocks
    let hardBlockStatus = 'PASS';
    const candidateStatus = (candidate.status ?? '').toUpperCase();

    if (candidateStatus === 'INACTIVE' || candidateStatus === 'DO_NOT_DISPATCH' || candidateStatus === 'DO NOT DISPATCH') {
      hardBlockStatus = 'FAIL';
      hardBlockReasons.push(`Candidate status is "${candidate.status}"`);
    } else if (!candidate.status) {
      hardBlockStatus = 'UNKNOWN';
      hardBlockReasons.push('Candidate status not set');
    }

    // Cert gate
    let certGateStatus = 'PASS';
    const now = new Date();

    if (candidate.candidateCerts.length === 0) {
      certGateStatus = 'UNKNOWN';
      certGateReasons.push('No certifications on file');
    } else {
      for (const cert of candidate.candidateCerts) {
        if (cert.expiresAt && cert.expiresAt < now) {
          certGateStatus = 'FAIL';
          certGateReasons.push(`Certification "${cert.certType.name}" (${cert.certType.code}) expired on ${cert.expiresAt.toISOString().slice(0, 10)}`);
        }
      }

      if (certGateStatus === 'PASS' && certGateReasons.length === 0) {
        certGateReasons.push('Requirement rules not configured - showing all certs as informational');
      }
    }

    // Compliance gate
    const complianceGateStatus = 'UNKNOWN';
    complianceGateReasons.push('Compliance fields (I-9, W-4, background, drug screen) not available in schema');

    // Overall status
    let overallStatus = 'READY';
    if (hardBlockStatus === 'FAIL' || certGateStatus === 'FAIL') {
      overallStatus = 'BLOCKED';
    } else if (hardBlockStatus === 'UNKNOWN' || certGateStatus === 'UNKNOWN' || complianceGateStatus === 'UNKNOWN') {
      overallStatus = 'UNKNOWN';
    }

    return {
      overallStatus,
      hardBlock: { status: hardBlockStatus, reasons: hardBlockReasons },
      certGate: { status: certGateStatus, reasons: certGateReasons },
      complianceGate: { status: complianceGateStatus, reasons: complianceGateReasons },
    };
  }

  /**
   * Build a simple error HTML page.
   */
  private buildErrorHtml(statusCode: number, title: string, message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error ${statusCode}: ${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
      padding: 24px;
      line-height: 1.5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .error-card {
      background: #fff;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 32px;
      max-width: 500px;
      text-align: center;
    }
    .error-code { font-size: 3rem; font-weight: 700; color: #b91c1c; margin-bottom: 8px; }
    .error-title { font-size: 1.25rem; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
    .error-message { color: #666; font-size: 0.95rem; }
    .back-link { display: inline-block; margin-top: 16px; color: #3b82f6; text-decoration: none; font-size: 0.9rem; }
    .back-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="error-card">
    <div class="error-code">${statusCode}</div>
    <div class="error-title">${title}</div>
    <div class="error-message">${message}</div>
    <a href="/ui/internal/ui16" class="back-link">← Back to candidate list</a>
  </div>
</body>
</html>`;
  }

  /**
   * Build a "Database Unavailable" HTML page for dev environments.
   */
  private buildDbUnavailableHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Unavailable</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
      padding: 24px;
      line-height: 1.5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .error-card {
      background: #fff;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 32px;
      max-width: 550px;
      text-align: center;
    }
    .error-icon { font-size: 3rem; margin-bottom: 12px; }
    .error-title { font-size: 1.25rem; font-weight: 600; color: #b91c1c; margin-bottom: 12px; }
    .error-message { color: #666; font-size: 0.95rem; margin-bottom: 16px; }
    code {
      display: block;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 10px 16px;
      border-radius: 4px;
      font-size: 0.9rem;
      margin: 16px auto;
      max-width: 280px;
    }
    .back-link { display: inline-block; margin-top: 12px; color: #3b82f6; text-decoration: none; font-size: 0.9rem; }
    .back-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="error-card">
    <div class="error-icon">🔌</div>
    <div class="error-title">Database unavailable</div>
    <div class="error-message">
      Current database is not reachable. If you want to view UI-16 without DB access, set:
    </div>
    <code>UI_DEMO_MODE=true</code>
    <a href="/ui/internal/ui16" class="back-link">← Retry</a>
  </div>
</body>
</html>`;
  }
}

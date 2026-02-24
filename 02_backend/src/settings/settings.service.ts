// D:\JARVIS\02_backend\src\settings\settings.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SETTINGS_KEYS,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_BANK_LAG_DAYS,
  DEFAULT_POSTING_GRACE_DAYS,
  DEFAULT_PAYOUT_TIERS,
  DEFAULT_INVOICE_FOOTER_TEXT,
  CommissionPayoutTier,
} from './settings.constants';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- generic helpers ----------

  private async getString(
    key: string,
    fallback?: string,
  ): Promise<string | undefined> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return row?.valueJson ?? fallback;
  }

  private async getNumber(key: string, fallback: number): Promise<number> {
    const raw = await this.getString(key);
    const parsed = raw !== undefined ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private async getJson<T>(key: string, fallback: T): Promise<T> {
    const raw = await this.getString(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  // ---------- finance / commission getters ----------

  async getDefaultCommissionRate(): Promise<number> {
    return this.getNumber(
      SETTINGS_KEYS.COMMISSION_DEFAULT_RATE,
      DEFAULT_COMMISSION_RATE,
    );
  }

  async getBankLagDays(): Promise<number> {
    return this.getNumber(
      SETTINGS_KEYS.COMMISSION_BANK_LAG_DAYS,
      DEFAULT_BANK_LAG_DAYS,
    );
  }

  async getPostingGraceDays(): Promise<number> {
    return this.getNumber(
      SETTINGS_KEYS.COMMISSION_POSTING_GRACE_DAYS,
      DEFAULT_POSTING_GRACE_DAYS,
    );
  }

  async getCommissionPayoutTiers(): Promise<CommissionPayoutTier[]> {
    return this.getJson<CommissionPayoutTier[]>(
      SETTINGS_KEYS.COMMISSION_PAYOUT_TIERS_JSON,
      DEFAULT_PAYOUT_TIERS,
    );
  }

  // ---------- invoice getters ----------

  async getInvoiceFooterText(): Promise<string> {
    const value = await this.getString(
      SETTINGS_KEYS.INVOICE_FOOTER_TEXT,
      DEFAULT_INVOICE_FOOTER_TEXT,
    );
    return value ?? DEFAULT_INVOICE_FOOTER_TEXT;
  }

  // ---------- generic setter helper ----------

  private async setString(
    key: string,
    value: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      update: { valueJson: value, updatedByUserId: userId },
      create: { key, valueJson: value, updatedByUserId: userId },
    });
  }

  // ---------- finance / commission setters ----------

  async setDefaultCommissionRate(rate: number, userId: string): Promise<void> {
    await this.setString(
      SETTINGS_KEYS.COMMISSION_DEFAULT_RATE,
      String(rate),
      userId,
    );
  }

  async setBankLagDays(days: number, userId: string): Promise<void> {
    await this.setString(
      SETTINGS_KEYS.COMMISSION_BANK_LAG_DAYS,
      String(days),
      userId,
    );
  }

  async setPostingGraceDays(days: number, userId: string): Promise<void> {
    await this.setString(
      SETTINGS_KEYS.COMMISSION_POSTING_GRACE_DAYS,
      String(days),
      userId,
    );
  }

  async setCommissionPayoutTiers(
    tiers: CommissionPayoutTier[],
    userId: string,
  ): Promise<void> {
    await this.setString(
      SETTINGS_KEYS.COMMISSION_PAYOUT_TIERS_JSON,
      JSON.stringify(tiers),
      userId,
    );
  }

  // ---------- invoice setters ----------

  async setInvoiceFooterText(text: string, userId: string): Promise<void> {
    await this.setString(SETTINGS_KEYS.INVOICE_FOOTER_TEXT, text, userId);
  }
}

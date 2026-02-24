// D:\JARVIS\02_backend\src\settings\settings.constants.ts

/**
 * Phase 8 Finance — System Settings (LOCKED KEYS)
 * - Settings are editable only by "Mike-only" endpoints later (Phase 8.3.1 services/controllers).
 * - Defaults here are the canonical bootstrap values.
 */

export const SETTINGS_KEYS = {
    // Commission configuration
    COMMISSION_DEFAULT_RATE: 'finance.commission.defaultRate', // number (0.10)
    COMMISSION_BANK_LAG_DAYS: 'finance.commission.bankLagDays', // integer (1)
    COMMISSION_POSTING_GRACE_DAYS: 'finance.commission.postingGraceDays', // integer (1)
  
    /**
     * Payout tiers:
     * 0–40: 100% | 41–59: 75% | 60–89: 50% | 90+: 0%
     *
     * Stored as JSON string in SystemSetting.value for flexibility.
     */
    COMMISSION_PAYOUT_TIERS_JSON: 'finance.commission.payoutTiersJson',

    // Invoice configuration
    /** Footer text displayed on customer invoices (remittance & terms). Empty string = placeholder shown. */
    INVOICE_FOOTER_TEXT: 'invoice.footerText', // string
  } as const;
  
  export type SettingsKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];
  
  export type CommissionPayoutTier = {
    /** inclusive min days */
    minDays: number;
    /** inclusive max days; null means open-ended */
    maxDays: number | null;
    /** multiplier applied to commission (1.0, 0.75, etc.) */
    multiplier: number;
  };
  
export const DEFAULT_COMMISSION_RATE = 0.1;
export const DEFAULT_BANK_LAG_DAYS = 1;
export const DEFAULT_POSTING_GRACE_DAYS = 1;
export const DEFAULT_INVOICE_FOOTER_TEXT = '';
  
  export const DEFAULT_PAYOUT_TIERS: CommissionPayoutTier[] = [
    { minDays: 0,  maxDays: 40, multiplier: 1.0 },
    { minDays: 41, maxDays: 59, multiplier: 0.75 },
    { minDays: 60, maxDays: 89, multiplier: 0.5 },
    { minDays: 90, maxDays: null, multiplier: 0.0 },
  ];
  
  export const DEFAULT_SETTINGS = [
    {
      key: SETTINGS_KEYS.COMMISSION_DEFAULT_RATE,
      value: String(DEFAULT_COMMISSION_RATE),
    },
    {
      key: SETTINGS_KEYS.COMMISSION_BANK_LAG_DAYS,
      value: String(DEFAULT_BANK_LAG_DAYS),
    },
    {
      key: SETTINGS_KEYS.COMMISSION_POSTING_GRACE_DAYS,
      value: String(DEFAULT_POSTING_GRACE_DAYS),
    },
    {
      key: SETTINGS_KEYS.COMMISSION_PAYOUT_TIERS_JSON,
      value: JSON.stringify(DEFAULT_PAYOUT_TIERS),
    },
    {
      key: SETTINGS_KEYS.INVOICE_FOOTER_TEXT,
      value: DEFAULT_INVOICE_FOOTER_TEXT,
    },
  ] as const;
  
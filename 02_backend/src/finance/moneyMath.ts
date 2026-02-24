/**
 * moneyMath.ts — Canonical Backend Money Math Helper
 *
 * PURE functions only. No side effects. No IO.
 * This file is definition-only authority for future snapshot math.
 *
 * LOCKED RULES:
 * - Payroll multipliers: REG=1.0, OT=1.5, DT=2.0
 * - Billing multipliers: REG=1.0, OT=otMultiplier (passed in), DT=round2(OT×4/3)
 * - SD is additive delta ONLY, does NOT modify base rates
 * - SD applies ONLY to SD-classified hours
 * - SD uses SAME multipliers as base hours
 */

export type PayrollMultiplierType = 'REG' | 'OT' | 'DT';

/**
 * Round to 2 decimal places (standard money rounding).
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute billing DT multiplier from OT multiplier.
 * DT billing = round2(otMultiplier × 4/3)
 */
export function computeBillingDtMultiplier(otMultiplier: number): number {
  return round2((otMultiplier * 4) / 3);
}

export interface EffectiveRateInput {
  baseRate: number;
  sdDeltaRate: number;
  multiplier: number;
  isSd: boolean;
}

/**
 * Compute effective rate.
 * - Non-SD: baseRate × multiplier
 * - SD: (baseRate + sdDeltaRate) × multiplier
 */
export function computeEffectiveRate(input: EffectiveRateInput): number {
  const { baseRate, sdDeltaRate, multiplier, isSd } = input;
  if (isSd) {
    return round2((baseRate + sdDeltaRate) * multiplier);
  }
  return round2(baseRate * multiplier);
}

export interface PreviewRow {
  bucket: string;
  hours: number;
  payMultiplier: number;
  effectivePayRate: number;
  payAmount: number;
  billMultiplier: number;
  effectiveBillRate: number;
  billAmount: number;
}

export interface PreviewRowInput {
  basePayRate: number;
  baseBillRate: number;
  otBillMultiplier: number;
  sdPayDeltaRate: number;
  sdBillDeltaRate: number;
  regHours: number;
  otHours: number;
  dtHours: number;
  regSdHours: number;
  otSdHours: number;
  dtSdHours: number;
}

export interface PreviewResult {
  rows: PreviewRow[];
  totalHours: number;
  totalPay: number;
  totalBill: number;
}

// Payroll multipliers (LOCKED)
const PAY_MULTIPLIERS: Record<PayrollMultiplierType, number> = {
  REG: 1.0,
  OT: 1.5,
  DT: 2.0,
};

/**
 * Compute preview rows for payroll/billing projection.
 *
 * Fixed row order (REQUIRED):
 * 1. REG
 * 2. OT
 * 3. DT
 * 4. REG (SD)
 * 5. OT (SD)
 * 6. DT (SD)
 */
export function computePreviewRows(input: PreviewRowInput): PreviewResult {
  const {
    basePayRate,
    baseBillRate,
    otBillMultiplier,
    sdPayDeltaRate,
    sdBillDeltaRate,
    regHours,
    otHours,
    dtHours,
    regSdHours,
    otSdHours,
    dtSdHours,
  } = input;

  // Billing multipliers: REG=1.0, OT=passed in, DT=round2(OT×4/3)
  const dtBillMultiplier = computeBillingDtMultiplier(otBillMultiplier);

  const rows: PreviewRow[] = [];

  // Helper to build a single row
  const buildRow = (
    bucket: string,
    hours: number,
    payMultType: PayrollMultiplierType,
    billMultiplier: number,
    isSd: boolean,
  ): PreviewRow => {
    const payMultiplier = PAY_MULTIPLIERS[payMultType];

    const effectivePayRate = computeEffectiveRate({
      baseRate: basePayRate,
      sdDeltaRate: sdPayDeltaRate,
      multiplier: payMultiplier,
      isSd,
    });

    const effectiveBillRate = computeEffectiveRate({
      baseRate: baseBillRate,
      sdDeltaRate: sdBillDeltaRate,
      multiplier: billMultiplier,
      isSd,
    });

    const payAmount = round2(effectivePayRate * hours);
    const billAmount = round2(effectiveBillRate * hours);

    return {
      bucket,
      hours,
      payMultiplier,
      effectivePayRate,
      payAmount,
      billMultiplier,
      effectiveBillRate,
      billAmount,
    };
  };

  // Fixed row order (REQUIRED)
  rows.push(buildRow('REG', regHours, 'REG', 1.0, false));
  rows.push(buildRow('OT', otHours, 'OT', otBillMultiplier, false));
  rows.push(buildRow('DT', dtHours, 'DT', dtBillMultiplier, false));
  rows.push(buildRow('REG (SD)', regSdHours, 'REG', 1.0, true));
  rows.push(buildRow('OT (SD)', otSdHours, 'OT', otBillMultiplier, true));
  rows.push(buildRow('DT (SD)', dtSdHours, 'DT', dtBillMultiplier, true));

  // Compute totals
  let totalHours = 0;
  let totalPay = 0;
  let totalBill = 0;

  for (const row of rows) {
    totalHours += row.hours;
    totalPay += row.payAmount;
    totalBill += row.billAmount;
  }

  return {
    rows,
    totalHours: round2(totalHours),
    totalPay: round2(totalPay),
    totalBill: round2(totalBill),
  };
}

export class CreatePayrollBurdenRateDto {
  level!: 'WORKER' | 'SITE' | 'STATE' | 'GLOBAL';
  category!: 'WC' | 'GL' | 'FICA' | 'SUTA' | 'FUTA' | 'PEO' | 'OVERHEAD' | 'INT_W' | 'INT_PD';

  effectiveDate!: string; // ISO string

  ratePercent!: number;

  workerId?: string;
  locationId?: string;
  stateCode?: string;
}

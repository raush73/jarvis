/**
 * UI-16 Demo Data Fixture
 *
 * Static, deterministic demo candidates for UI-16 viewing without DB connectivity.
 * Used when UI_DEMO_MODE=true.
 */

export interface DemoCandidateSummary {
  id: string;
  fullName: string;
  trade: string;
  homeCityState: string;
  status: string;
}

export interface DemoCandidateDetail extends DemoCandidateSummary {
  phone: string;
  email: string;
  certs: DemoCert[];
  complianceFlags: DemoComplianceFlag[];
  notes: string;
}

export interface DemoCert {
  code: string;
  name: string;
  status: string;
  verification: string;
  issuedAt: string | null;
  expiresAt: string | null;
}

export interface DemoComplianceFlag {
  type: string;
  status: string;
}

export const demoCandidates: DemoCandidateDetail[] = [
  {
    id: 'DEMO-0001',
    fullName: 'Demo Welder Alpha',
    trade: 'Welder',
    homeCityState: 'Houston, TX',
    status: 'ACTIVE',
    phone: '555-DEMO-001',
    email: 'demo.welder.alpha@example.test',
    certs: [
      { code: 'AWS-D1.1', name: 'AWS Structural Welding', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2024-01-15', expiresAt: '2027-01-15' },
      { code: 'OSHA-10', name: 'OSHA 10-Hour', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2023-06-01', expiresAt: null },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'CLEARED' },
    ],
    notes: 'Demo candidate. Reliable welder with 5+ years experience.',
  },
  {
    id: 'DEMO-0002',
    fullName: 'Demo Pipefitter Bravo',
    trade: 'Pipefitter',
    homeCityState: 'Beaumont, TX',
    status: 'ACTIVE',
    phone: '555-DEMO-002',
    email: 'demo.pipefitter.bravo@example.test',
    certs: [
      { code: 'NCCER-PIPE', name: 'NCCER Pipefitting', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2022-03-10', expiresAt: null },
      { code: 'OSHA-30', name: 'OSHA 30-Hour', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2023-09-15', expiresAt: null },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'CLEARED' },
    ],
    notes: 'Demo candidate. Experienced pipefitter, union background.',
  },
  {
    id: 'DEMO-0003',
    fullName: 'Demo Electrician Charlie',
    trade: 'Electrician',
    homeCityState: 'Dallas, TX',
    status: 'ACTIVE',
    phone: '555-DEMO-003',
    email: 'demo.electrician.charlie@example.test',
    certs: [
      { code: 'TX-JOURNEYMAN', name: 'Texas Journeyman Electrician', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2021-11-20', expiresAt: '2025-11-20' },
      { code: 'OSHA-10', name: 'OSHA 10-Hour', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2022-02-01', expiresAt: null },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'PENDING' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'CLEARED' },
    ],
    notes: 'Demo candidate. Journeyman electrician, needs W-4 update.',
  },
  {
    id: 'DEMO-0004',
    fullName: 'Demo Ironworker Delta',
    trade: 'Ironworker',
    homeCityState: 'Austin, TX',
    status: 'INACTIVE',
    phone: '555-DEMO-004',
    email: 'demo.ironworker.delta@example.test',
    certs: [
      { code: 'OSHA-10', name: 'OSHA 10-Hour', status: 'EXPIRED', verification: 'MANUAL', issuedAt: '2019-05-01', expiresAt: '2022-05-01' },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'EXPIRED' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'OVERDUE' },
    ],
    notes: 'Demo candidate. INACTIVE status — needs recertification.',
  },
  {
    id: 'DEMO-0005',
    fullName: 'Demo Millwright Echo',
    trade: 'Millwright',
    homeCityState: 'San Antonio, TX',
    status: 'ACTIVE',
    phone: '555-DEMO-005',
    email: 'demo.millwright.echo@example.test',
    certs: [
      { code: 'NCCER-MILL', name: 'NCCER Millwright', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2023-01-10', expiresAt: null },
      { code: 'OSHA-30', name: 'OSHA 30-Hour', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2023-04-20', expiresAt: null },
      { code: 'FORKLIFT', name: 'Forklift Operator', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2024-02-15', expiresAt: '2027-02-15' },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'CLEARED' },
    ],
    notes: 'Demo candidate. Skilled millwright with forklift certification.',
  },
  {
    id: 'DEMO-0006',
    fullName: 'Demo Scaffold Foxtrot',
    trade: 'Scaffold Builder',
    homeCityState: 'Corpus Christi, TX',
    status: 'ACTIVE',
    phone: '555-DEMO-006',
    email: 'demo.scaffold.foxtrot@example.test',
    certs: [
      { code: 'SCAFFOLD-COMP', name: 'Scaffold Competent Person', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2023-08-01', expiresAt: '2026-08-01' },
      { code: 'OSHA-10', name: 'OSHA 10-Hour', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2022-11-10', expiresAt: null },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'CLEARED' },
    ],
    notes: 'Demo candidate. Certified scaffold builder.',
  },
  {
    id: 'DEMO-0007',
    fullName: 'Demo Rigger Golf',
    trade: 'Rigger',
    homeCityState: 'Galveston, TX',
    status: 'DO_NOT_DISPATCH',
    phone: '555-DEMO-007',
    email: 'demo.rigger.golf@example.test',
    certs: [
      { code: 'NCCCO-RIGGER', name: 'NCCCO Rigger Level I', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2022-06-15', expiresAt: '2027-06-15' },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'FLAGGED' },
      { type: 'DRUG_SCREEN', status: 'FAILED' },
    ],
    notes: 'Demo candidate. DO NOT DISPATCH — compliance issues.',
  },
  {
    id: 'DEMO-0008',
    fullName: 'Demo Carpenter Hotel',
    trade: 'Carpenter',
    homeCityState: 'Fort Worth, TX',
    status: 'ACTIVE',
    phone: '555-DEMO-008',
    email: 'demo.carpenter.hotel@example.test',
    certs: [
      { code: 'OSHA-10', name: 'OSHA 10-Hour', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2024-03-01', expiresAt: null },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'CLEARED' },
    ],
    notes: 'Demo candidate. Finish carpenter, commercial experience.',
  },
  {
    id: 'DEMO-0009',
    fullName: 'Demo Insulator India',
    trade: 'Insulator',
    homeCityState: 'Odessa, TX',
    status: 'ACTIVE',
    phone: '555-DEMO-009',
    email: 'demo.insulator.india@example.test',
    certs: [
      { code: 'NIA-JOURNEYMAN', name: 'NIA Journeyman Insulator', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2020-09-01', expiresAt: null },
      { code: 'OSHA-30', name: 'OSHA 30-Hour', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2021-01-15', expiresAt: null },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'CLEARED' },
    ],
    notes: 'Demo candidate. Mechanical insulation specialist.',
  },
  {
    id: 'DEMO-0010',
    fullName: 'Demo Boilermaker Juliet',
    trade: 'Boilermaker',
    homeCityState: 'Midland, TX',
    status: 'ACTIVE',
    phone: '555-DEMO-010',
    email: 'demo.boilermaker.juliet@example.test',
    certs: [
      { code: 'NCCER-BOILER', name: 'NCCER Boilermaker', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2022-07-20', expiresAt: null },
      { code: 'AWS-D1.1', name: 'AWS Structural Welding', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2023-02-10', expiresAt: '2026-02-10' },
      { code: 'OSHA-30', name: 'OSHA 30-Hour', status: 'VERIFIED', verification: 'MANUAL', issuedAt: '2023-05-01', expiresAt: null },
    ],
    complianceFlags: [
      { type: 'I-9', status: 'COMPLETE' },
      { type: 'W-4', status: 'COMPLETE' },
      { type: 'BACKGROUND', status: 'CLEARED' },
      { type: 'DRUG_SCREEN', status: 'CLEARED' },
    ],
    notes: 'Demo candidate. Boilermaker with welding certs, refinery experience.',
  },
];

/**
 * Find a demo candidate by ID.
 */
export function getDemoCandidateById(id: string): DemoCandidateDetail | undefined {
  return demoCandidates.find((c) => c.id === id);
}

/**
 * Get all demo candidate summaries for the list view.
 */
export function getDemoCandidateSummaries(): DemoCandidateSummary[] {
  return demoCandidates.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    trade: c.trade,
    homeCityState: c.homeCityState,
    status: c.status,
  }));
}


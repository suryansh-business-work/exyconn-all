/**
 * The cost lines and categories of the GCC calculator's scenario templates (the `preset` of
 * 'gcc.calculator'). Every amount is an ILLUSTRATIVE assumption in INR, labelled as such in the
 * calculator; Exyconn's own services carry no price ("quoted on request"). The shapes are the
 * ones `@exyconn/gcc-cost` validates (calculatorPresetSchema); this package stays dependency-free,
 * so the website checks them when it renders the calculator.
 */

export interface GccSource {
  kind: string;
  note: string;
  url: string;
  checkedOn: string;
}

export const GCC_ILLUSTRATIVE: GccSource = {
  kind: 'illustrative',
  note: 'Illustrative assumption — replace with your own quote or payroll data',
  url: '',
  checkedOn: '',
};

const QUOTED: GccSource = {
  kind: 'user',
  note: 'Quoted by Exyconn on request',
  url: '',
  checkedOn: '',
};

export interface GccLine {
  id: string;
  section: string;
  categoryId: string;
  label: string;
  description: string;
  pricing: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  ratePct: number;
  percentBase: string;
  frequency: string;
  startMonth: number;
  endMonth: number | null;
  escalationPct: number;
  setupFee: number;
  taxRatePct: number;
  applicability: string;
  optional: boolean;
  enabled: boolean;
  source: GccSource;
}

type LineFields = Pick<GccLine, 'id' | 'section' | 'categoryId' | 'label'> & Partial<GccLine>;

const LINE_DEFAULTS: Omit<GccLine, 'id' | 'section' | 'categoryId' | 'label'> = {
  description: '',
  pricing: 'flat',
  quantity: 1,
  unitPrice: 0,
  currency: 'INR',
  ratePct: 0,
  percentBase: 'operating',
  frequency: 'monthly',
  startMonth: 1,
  endMonth: null,
  escalationPct: 5,
  setupFee: 0,
  taxRatePct: 18,
  applicability: 'applicable',
  optional: false,
  enabled: true,
  source: GCC_ILLUSTRATIVE,
};

const line = (fields: LineFields): GccLine => ({ ...LINE_DEFAULTS, ...fields });

/** A line of one section and category: `at('legal', 'legal-tax')({ id, label, … })`. */
const at =
  (section: string, categoryId: string) =>
  (fields: Omit<LineFields, 'section' | 'categoryId'>): GccLine =>
    line({ section, categoryId, ...fields });

export const GCC_CATEGORIES = [
  { id: 'office-extras', section: 'office', label: 'Office extras' },
  { id: 'tech-cloud', section: 'technology', label: 'Cloud and infrastructure' },
  { id: 'tech-tools', section: 'technology', label: 'Software and licences' },
  { id: 'tech-security', section: 'technology', label: 'Security and resilience' },
  { id: 'legal-entity', section: 'legal', label: 'Entity and advisory' },
  { id: 'legal-tax', section: 'legal', label: 'Tax and statutory' },
  { id: 'legal-compliance', section: 'legal', label: 'Compliance and protection' },
  { id: 'hr-hiring', section: 'hr', label: 'Hiring and onboarding' },
  { id: 'hr-ops', section: 'hr', label: 'HR operations' },
  { id: 'hr-people', section: 'hr', label: 'Engagement and development' },
  { id: 'admin-facility', section: 'admin', label: 'Facility and running costs' },
  { id: 'admin-travel', section: 'admin', label: 'Travel and logistics' },
  { id: 'services-setup', section: 'services', label: 'Exyconn setup services' },
  { id: 'services-ongoing', section: 'services', label: 'Exyconn ongoing services' },
];

/** Office extras beyond rent, seats and the running costs the office inputs already cover. */
function officeLines(scale: number): GccLine[] {
  const extra = at('office', 'office-extras');
  return [
    extra({
      id: 'access-control',
      label: 'Access control and CCTV',
      frequency: 'one-time',
      unitPrice: 150000 * scale,
    }),
    extra({
      id: 'signage',
      label: 'Signage and branding',
      frequency: 'one-time',
      unitPrice: 75000 * scale,
    }),
  ];
}

function technologyLines(scale: number): GccLine[] {
  const cloud = at('technology', 'tech-cloud');
  const tools = at('technology', 'tech-tools');
  const security = at('technology', 'tech-security');
  return [
    cloud({
      id: 'cloud-compute',
      label: 'Cloud compute',
      unitPrice: 150000 * scale,
      escalationPct: 10,
    }),
    cloud({
      id: 'vector-db',
      label: 'Vector database',
      unitPrice: 25000 * scale,
      escalationPct: 10,
    }),
    cloud({
      id: 'gpu-capacity',
      label: 'GPU capacity',
      description:
        'Reserved or on-demand GPUs for training and inference, if the centre needs them.',
      unitPrice: 200000 * scale,
      escalationPct: 10,
      optional: true,
    }),
    cloud({ id: 'storage-backups', label: 'Storage and backups', unitPrice: 20000 * scale }),
    cloud({ id: 'monitoring', label: 'Monitoring and observability', unitPrice: 30000 * scale }),
    tools({
      id: 'software-licences',
      label: 'Productivity and collaboration licences',
      pricing: 'per-employee',
      unitPrice: 2500,
    }),
    tools({ id: 'dev-tools', label: 'Developer tools', pricing: 'per-employee', unitPrice: 2000 }),
    security({
      id: 'cybersecurity',
      label: 'Cybersecurity (endpoint, identity, email)',
      pricing: 'per-employee',
      unitPrice: 1500,
      setupFee: 200000 * scale,
    }),
    security({
      id: 'vpn-redundancy',
      label: 'VPN and network redundancy',
      unitPrice: 25000 * scale,
    }),
  ];
}

function legalLines(scale: number): GccLine[] {
  const entity = at('legal', 'legal-entity');
  const tax = at('legal', 'legal-tax');
  const compliance = at('legal', 'legal-compliance');
  return [
    entity({
      id: 'incorporation',
      label: 'Entity incorporation',
      frequency: 'one-time',
      unitPrice: 150000,
    }),
    entity({ id: 'legal-advisory', label: 'Legal advisory retainer', unitPrice: 50000 * scale }),
    entity({
      id: 'employment-contracts',
      label: 'Employment contracts and policies',
      frequency: 'one-time',
      unitPrice: 100000,
    }),
    entity({
      id: 'fema-advisory',
      label: 'FEMA and cross-border advisory',
      frequency: 'one-time',
      unitPrice: 150000,
      applicability: 'review',
    }),
    tax({ id: 'accounting', label: 'Accounting and bookkeeping', unitPrice: 60000 * scale }),
    tax({ id: 'statutory-filing', label: 'Tax and statutory filings', unitPrice: 40000 * scale }),
    tax({ id: 'gst-support', label: 'GST compliance support', unitPrice: 20000 * scale }),
    tax({
      id: 'transfer-pricing',
      label: 'Transfer pricing documentation',
      frequency: 'annual',
      unitPrice: 400000 * scale,
      applicability: 'review',
    }),
    tax({
      id: 'audit-secretarial',
      label: 'Statutory audit and secretarial',
      frequency: 'annual',
      unitPrice: 300000 * scale,
    }),
    compliance({
      id: 'data-protection',
      label: 'Data protection programme',
      frequency: 'one-time',
      unitPrice: 200000 * scale,
    }),
    compliance({
      id: 'ip-protection',
      label: 'IP assignment and protection',
      frequency: 'one-time',
      unitPrice: 100000,
    }),
    compliance({
      id: 'labour-compliance',
      label: 'Labour law compliance',
      unitPrice: 25000 * scale,
    }),
    compliance({
      id: 'business-insurance',
      label: 'Business insurance (liability, cyber, D&O)',
      frequency: 'annual',
      unitPrice: 250000 * scale,
    }),
  ];
}

function hrLines(scale: number): GccLine[] {
  const hiring = at('hr', 'hr-hiring');
  const ops = at('hr', 'hr-ops');
  const people = at('hr', 'hr-people');
  return [
    hiring({
      id: 'background-checks',
      label: 'Background verification',
      pricing: 'per-hire',
      unitPrice: 5000,
    }),
    hiring({
      id: 'onboarding',
      label: 'Onboarding and induction',
      pricing: 'per-hire',
      unitPrice: 10000,
    }),
    ops({
      id: 'payroll-processing',
      label: 'Payroll processing',
      pricing: 'per-employee',
      unitPrice: 400,
    }),
    ops({ id: 'hr-operations', label: 'HR operations and HRMS', unitPrice: 40000 * scale }),
    ops({
      id: 'benefits-admin',
      label: 'Benefits administration',
      pricing: 'per-employee',
      unitPrice: 300,
    }),
    people({
      id: 'engagement',
      label: 'Employee engagement',
      pricing: 'per-employee',
      unitPrice: 1000,
    }),
    people({
      id: 'learning',
      label: 'Learning and development',
      pricing: 'per-employee',
      frequency: 'annual',
      unitPrice: 25000,
    }),
    people({
      id: 'performance-tools',
      label: 'Performance management tools',
      pricing: 'per-employee',
      unitPrice: 400,
    }),
  ];
}

function adminLines(scale: number): GccLine[] {
  const facility = at('admin', 'admin-facility');
  const travel = at('admin', 'admin-travel');
  return [
    facility({ id: 'facility-management', label: 'Facility management', unitPrice: 30000 * scale }),
    facility({
      id: 'pantry',
      label: 'Pantry and refreshments',
      pricing: 'per-employee',
      unitPrice: 1500,
    }),
    facility({
      id: 'office-supplies',
      label: 'Office supplies',
      pricing: 'per-employee',
      unitPrice: 300,
    }),
    facility({ id: 'reception', label: 'Reception and front desk', unitPrice: 25000 * scale }),
    facility({
      id: 'telecom',
      label: 'Telecom and mobile',
      pricing: 'per-employee',
      unitPrice: 500,
    }),
    facility({ id: 'maintenance', label: 'Repairs and maintenance', unitPrice: 15000 * scale }),
    facility({
      id: 'asset-insurance',
      label: 'Asset and property insurance',
      frequency: 'annual',
      unitPrice: 100000 * scale,
    }),
    facility({
      id: 'miscellaneous',
      label: 'Miscellaneous',
      pricing: 'percentage',
      ratePct: 1,
      percentBase: 'operating',
    }),
    travel({
      id: 'employee-transport',
      label: 'Employee transport',
      pricing: 'per-employee',
      unitPrice: 2000,
      optional: true,
    }),
    travel({ id: 'business-travel', label: 'Business travel', unitPrice: 100000 * scale }),
    travel({ id: 'courier', label: 'Courier and logistics', unitPrice: 5000 * scale }),
  ];
}

/** Exyconn's services: listed so they can be planned for, never priced here. */
const EXYCONN_SERVICES = [
  ['feasibility', 'Feasibility study', 'services-setup'],
  ['location-assessment', 'Location assessment', 'services-setup'],
  ['launch-management', 'Launch management', 'services-setup'],
  ['technology-architecture', 'Technology architecture', 'services-setup'],
  ['ai-enablement', 'AI enablement', 'services-setup'],
  ['recruitment-coordination', 'Recruitment coordination', 'services-setup'],
  ['implementation-transition', 'Implementation and transition', 'services-setup'],
  ['hr-operations-support', 'HR operations support', 'services-ongoing'],
  ['admin-coordination', 'Administration coordination', 'services-ongoing'],
  ['vendor-management', 'Vendor management', 'services-ongoing'],
  ['gcc-management', 'Ongoing GCC management', 'services-ongoing'],
  ['scaling-support', 'Scaling support', 'services-ongoing'],
] as const;

function serviceLines(): GccLine[] {
  return EXYCONN_SERVICES.map(([id, label, categoryId]) =>
    line({
      id: `exyconn-${id}`,
      section: 'services',
      categoryId,
      label,
      frequency: categoryId === 'services-setup' ? 'one-time' : 'monthly',
      optional: true,
      source: QUOTED,
    }),
  );
}

/** Every cost line of a scenario; `scale` multiplies the fixed (flat) amounts. */
export function gccLines(scale: number): GccLine[] {
  return [
    ...officeLines(scale),
    ...technologyLines(scale),
    ...legalLines(scale),
    ...hrLines(scale),
    ...adminLines(scale),
    ...serviceLines(),
  ];
}

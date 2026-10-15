/**
 * The three scenario templates of the GCC calculator — Lean (about 25 people in coworking),
 * Standard (about 75 in a managed office) and Enterprise (about 200 in leased space with an
 * expansion). Salaries, seat prices, rents and budgets are ILLUSTRATIVE assumptions; the
 * statutory parameters are the rules in force (confirm with a qualified adviser):
 *
 * - EPF: the employer contributes 12% of PF wages; the EPS share is on wages capped at
 *   ₹15,000 a month (https://www.epfindia.gov.in/site_docs/PDFs/MiscPDFs/ContributionRate.pdf).
 * - Under the Labour Codes (in effect 21 November 2025) "wages" are at least 50% of
 *   remuneration, the base for PF and gratuity.
 * - Gratuity: 15 days' wages per completed year, a monthly provision of 15/26/12 ≈ 4.81%.
 */
import { GCC_CATEGORIES, gccLines } from './gcc.copy-preset-lines';

type RoleSpec = readonly [
  id: string,
  department: string,
  title: string,
  seniority: string,
  headcount: number,
  annualGross: number,
  hireMonth: number,
];

const ROLE_DEFAULTS = {
  costBasis: 'gross',
  basicSharePct: 50,
  employerPfPct: 12,
  pfWageCapped: true,
  gratuityPct: 4.81,
  otherStatutoryPct: 0,
  benefitsAnnual: 30000,
  shiftAllowanceMonthly: 0,
  incrementPct: null,
  recruitmentFeePct: 8.33,
  rampMonths: 3,
  attritionPct: null,
};

const role = ([id, department, title, seniority, headcount, annualGross, hireMonth]: RoleSpec) => ({
  id,
  department,
  title,
  seniority,
  headcount,
  annualGross,
  hireMonth,
  ...ROLE_DEFAULTS,
});

const SE = 'Software Engineering';
const AI = 'AI/ML and Data Science';
const PD = 'Product and Design';
const QA = 'QA and Automation';
const OPS = 'DevOps, Cloud and Cybersecurity';
const FIN = 'Finance and Accounting';
const HR = 'HR and Recruitment';
const CS = 'Customer Support';
const LEGAL = 'Legal and Compliance';
const ADMIN = 'Administration';
const LEAD = 'Leadership and Management';

const LEAN_ROLES: RoleSpec[] = [
  ['centre-head', LEAD, 'Centre head', 'director', 1, 6000000, 1],
  ['software-engineer', SE, 'Software engineer', 'mid', 8, 1500000, 2],
  ['senior-engineer', SE, 'Senior software engineer', 'senior', 3, 2800000, 1],
  ['ml-engineer', AI, 'Machine learning engineer', 'mid', 3, 2000000, 2],
  ['qa-engineer', QA, 'QA automation engineer', 'mid', 2, 1200000, 3],
  ['devops-engineer', OPS, 'DevOps engineer', 'mid', 2, 1800000, 1],
  ['product-designer', PD, 'Product designer', 'mid', 2, 1600000, 3],
  ['hr-generalist', HR, 'HR generalist', 'mid', 1, 900000, 1],
  ['accountant', FIN, 'Accountant', 'mid', 1, 800000, 2],
  ['admin-executive', ADMIN, 'Administration executive', 'junior', 1, 450000, 1],
  ['support-specialist', CS, 'Support specialist', 'junior', 1, 500000, 4],
];

const STANDARD_ROLES: RoleSpec[] = [
  ['centre-head', LEAD, 'Centre head', 'director', 1, 7500000, 1],
  ['engineering-manager', LEAD, 'Engineering manager', 'manager', 1, 4500000, 2],
  ['software-engineer', SE, 'Software engineer', 'mid', 23, 1500000, 2],
  ['senior-engineer', SE, 'Senior software engineer', 'senior', 8, 2800000, 2],
  ['tech-lead', SE, 'Technical lead', 'lead', 3, 4000000, 1],
  ['ml-engineer', AI, 'Machine learning engineer', 'mid', 8, 2000000, 3],
  ['product-manager', PD, 'Product manager and designers', 'senior', 5, 2400000, 3],
  ['qa-engineer', QA, 'QA automation engineer', 'mid', 6, 1200000, 3],
  ['devops-engineer', OPS, 'DevOps and security engineer', 'mid', 5, 1800000, 2],
  ['support-specialist', CS, 'Support specialist', 'junior', 6, 500000, 4],
  ['accountant', FIN, 'Finance team', 'mid', 3, 900000, 2],
  ['hr-generalist', HR, 'HR and recruitment team', 'mid', 3, 900000, 1],
  ['compliance-officer', LEGAL, 'Compliance officer', 'senior', 1, 2500000, 3],
  ['admin-executive', ADMIN, 'Administration team', 'junior', 2, 450000, 1],
];

const ENTERPRISE_ROLES: RoleSpec[] = [
  ['centre-head', LEAD, 'Centre head', 'director', 1, 9000000, 1],
  ['delivery-manager', LEAD, 'Delivery and function managers', 'manager', 5, 4500000, 3],
  ['software-engineer', SE, 'Software engineer', 'mid', 60, 1500000, 3],
  ['senior-engineer', SE, 'Senior software engineer', 'senior', 25, 2800000, 2],
  ['tech-lead', SE, 'Technical lead', 'lead', 8, 4000000, 2],
  ['ml-engineer', AI, 'AI/ML and data team', 'mid', 22, 2000000, 4],
  ['product-manager', PD, 'Product and design team', 'senior', 12, 2400000, 4],
  ['qa-engineer', QA, 'QA automation engineer', 'mid', 15, 1200000, 4],
  ['devops-engineer', OPS, 'DevOps, cloud and security team', 'mid', 14, 1800000, 2],
  ['support-specialist', CS, 'Support specialist', 'junior', 18, 500000, 6],
  ['accountant', FIN, 'Finance team', 'mid', 6, 900000, 2],
  ['hr-generalist', HR, 'HR and recruitment team', 'mid', 7, 900000, 1],
  ['compliance-officer', LEGAL, 'Legal and compliance team', 'senior', 3, 2500000, 3],
  ['admin-executive', ADMIN, 'Administration team', 'junior', 4, 450000, 1],
];

const OFFICE_DEFAULTS = {
  microLocation: '',
  utilisationPct: 80,
  areaPerSeatSqft: 0,
  rentPerSqftMonthly: 0,
  camPerSqftMonthly: 0,
  seatPriceMonthly: 0,
  depositMonths: 2,
  fitoutPerSqft: 0,
  furnitureSetup: 0,
  internetMonthly: 0,
  utilitiesMonthly: 0,
  housekeepingSecurityMonthly: 0,
  transportParkingInsuranceMonthly: 0,
  rentEscalationPct: 5,
  expansions: [] as { id: string; month: number; seats: number }[],
};

const ASSUMPTIONS = {
  forecastMonths: 36,
  salaryInflationPct: 9,
  techGrowthPct: 10,
  attritionPct: 12,
  contingencyPct: 7.5,
  workingCapitalMonths: 3,
  paymentTiming: 'arrears',
  discountRatePct: null,
  pfWageCeilingMonthly: 15000,
  officeTaxPct: 18,
  technologyTaxPct: 18,
  monthlyBenefit: null,
  operatingPhaseMonth: 36,
};

const ai = (monthlyBudget: number) => ({
  mode: 'budget',
  monthlyBudget,
  budgetCurrency: 'INR',
  subscriptions: [],
  usage: [],
  hardwarePerEmployee: 90000,
  hardwareCycleMonths: 36,
});

export const GCC_LEAN_SCENARIO = {
  id: 'lean',
  name: 'Lean',
  profile: {
    operatingModel: 'managed',
    launchDate: '',
    launchTimeline: '3–4 months',
    initialHeadcount: 10,
    targetHeadcountYear3: 25,
    workingModel: 'hybrid',
    shiftPattern: 'general',
  },
  office: {
    ...OFFICE_DEFAULTS,
    city: 'Bengaluru',
    model: 'coworking',
    seats: 20,
    seatPriceMonthly: 12000,
  },
  roles: LEAN_ROLES.map(role),
  ai: ai(50000),
  categories: GCC_CATEGORIES,
  lines: gccLines(1),
  assumptions: ASSUMPTIONS,
};

export const GCC_STANDARD_SCENARIO = {
  id: 'standard',
  name: 'Standard',
  profile: {
    operatingModel: 'hybrid',
    launchDate: '',
    launchTimeline: '4–6 months',
    initialHeadcount: 30,
    targetHeadcountYear3: 75,
    workingModel: 'hybrid',
    shiftPattern: 'extended',
  },
  office: {
    ...OFFICE_DEFAULTS,
    city: 'Hyderabad',
    model: 'managed',
    seats: 60,
    seatPriceMonthly: 15000,
    depositMonths: 3,
    transportParkingInsuranceMonthly: 25000,
  },
  roles: STANDARD_ROLES.map(role),
  ai: ai(150000),
  categories: GCC_CATEGORIES,
  lines: gccLines(2),
  assumptions: ASSUMPTIONS,
};

export const GCC_ENTERPRISE_SCENARIO = {
  id: 'enterprise',
  name: 'Enterprise',
  profile: {
    operatingModel: 'captive',
    launchDate: '',
    launchTimeline: '6–9 months',
    initialHeadcount: 80,
    targetHeadcountYear3: 200,
    workingModel: 'hybrid',
    shiftPattern: 'extended',
  },
  office: {
    ...OFFICE_DEFAULTS,
    city: 'Pune',
    model: 'leased',
    seats: 120,
    utilisationPct: 75,
    areaPerSeatSqft: 75,
    rentPerSqftMonthly: 90,
    camPerSqftMonthly: 15,
    depositMonths: 6,
    fitoutPerSqft: 2500,
    furnitureSetup: 1500000,
    internetMonthly: 150000,
    utilitiesMonthly: 250000,
    housekeepingSecurityMonthly: 300000,
    transportParkingInsuranceMonthly: 200000,
    expansions: [{ id: 'expansion-1', month: 13, seats: 30 }],
  },
  roles: ENTERPRISE_ROLES.map(role),
  ai: ai(500000),
  categories: GCC_CATEGORIES,
  lines: gccLines(4),
  assumptions: ASSUMPTIONS,
};

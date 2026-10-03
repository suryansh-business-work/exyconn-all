/**
 * Kosh Finserv's dummy catalogue: the firm, loan products, amount bands, insurance plans,
 * advisors and document checklists. Fictional names, numbers, insurers and `.example` links;
 * rates and premiums are illustrative only.
 */
import type { IconKey } from '../../visuals';

export const FIRM = {
  name: 'Kosh Finserv, SG Highway',
  phone: '+91 79 4890 5500',
  address: '7th floor, Titanium Heights, SG Highway, Prahlad Nagar, Ahmedabad 380015',
  lat: 23.0128,
  lng: 72.5108,
  website: 'https://koshfinserv.example',
  upload: 'https://secure.koshfinserv.example/upload',
  video: 'https://meet.koshfinserv.example',
  emiCalculator: 'https://koshfinserv.example/emi-calculator',
} as const;

/** The relationship manager every escalation is handed to. */
export const RELATIONSHIP_MANAGER = {
  agentName: 'Harsh Shah (Relationship manager)',
  name: 'Harsh Shah',
  phone: '+91 98250 55120',
  role: 'Relationship manager, loans',
} as const;

export interface LoanType {
  id: string;
  title: string;
  subtitle: string;
  /** Annual interest rate from, percent. */
  rate: string;
  maxTenure: number;
  /** EMI per ₹1 lakh at the starting rate and longest tenure, rupees. */
  emiPerLakh: number;
  /** Processing fee shown on the card, rupees. */
  processingFee: number;
  badge?: string;
  icon: IconKey;
}

export const LOAN_TYPES: readonly LoanType[] = [
  {
    id: 'home',
    title: 'Home loan',
    subtitle: 'Buy, build or renovate · up to 30 years',
    rate: '8.40',
    maxTenure: 30,
    emiPerLakh: 762,
    processingFee: 4999,
    badge: 'Lowest rate',
    icon: 'realestate',
  },
  {
    id: 'personal',
    title: 'Personal loan',
    subtitle: 'Up to ₹25 lakh · money in 24 hours',
    rate: '10.99',
    maxTenure: 5,
    emiPerLakh: 2174,
    processingFee: 1999,
    icon: 'payment',
  },
  {
    id: 'business',
    title: 'Business loan',
    subtitle: 'Working capital and expansion, no collateral',
    rate: '14.50',
    maxTenure: 5,
    emiPerLakh: 2353,
    processingFee: 2999,
    icon: 'store',
  },
  {
    id: 'car',
    title: 'Car loan',
    subtitle: 'New and used cars · up to 100% on-road',
    rate: '8.90',
    maxTenure: 7,
    emiPerLakh: 1601,
    processingFee: 2499,
    badge: 'Same-day approval',
    icon: 'car',
  },
  {
    id: 'gold',
    title: 'Gold loan',
    subtitle: 'Up to 75% of gold value in 30 minutes',
    rate: '9.25',
    maxTenure: 2,
    emiPerLakh: 4580,
    processingFee: 499,
    icon: 'star',
  },
  {
    id: 'education',
    title: 'Education loan',
    subtitle: 'India and abroad · moratorium till course ends',
    rate: '9.50',
    maxTenure: 15,
    emiPerLakh: 1044,
    processingFee: 999,
    icon: 'school',
  },
];

/** Shown when the amount could not be read from free text; `lakh` is stored. */
export const AMOUNT_BANDS = [
  { id: 'upto-5', title: 'Up to ₹5 lakh', lakh: '5' },
  { id: '5-25', title: '₹5 – 25 lakh', lakh: '15' },
  { id: '25-75', title: '₹25 – 75 lakh', lakh: '50' },
  { id: '75-plus', title: 'Above ₹75 lakh', lakh: '100' },
] as const;

export const INCOME_FLOOR = 25000;

export interface InsurancePlan {
  id: string;
  title: string;
  insurer: string;
  cover: string;
  /** Yearly premium from, rupees. */
  premium: number;
  badge?: string;
}

export interface InsuranceType {
  key: string;
  name: string;
  description: string;
  icon: IconKey;
  plans: readonly InsurancePlan[];
}

export const INSURANCE_TYPES: readonly InsuranceType[] = [
  {
    key: 'health',
    name: 'Health insurance',
    description: 'Cashless hospitals, family floater, top-ups',
    icon: 'heart',
    plans: [
      {
        id: 'h-shield',
        title: 'Shield Family',
        insurer: 'Suraksha General',
        cover: '₹10 lakh family floater',
        premium: 18400,
        badge: 'Popular',
      },
      {
        id: 'h-plus',
        title: 'Care Plus',
        insurer: 'Arogya Insurance',
        cover: '₹25 lakh, no room-rent cap',
        premium: 26900,
      },
      {
        id: 'h-topup',
        title: 'Super Top-up',
        insurer: 'Suraksha General',
        cover: '₹50 lakh above ₹5 lakh',
        premium: 6200,
        badge: 'Low cost',
      },
    ],
  },
  {
    key: 'term',
    name: 'Term life insurance',
    description: 'Pure protection for your family',
    icon: 'family',
    plans: [
      {
        id: 't-secure',
        title: 'Secure Life',
        insurer: 'Jeevan Mitra Life',
        cover: '₹1 crore till age 65',
        premium: 12800,
        badge: '99% claims paid',
      },
      {
        id: 't-return',
        title: 'Term + Return',
        insurer: 'Kavach Life',
        cover: '₹1 crore, premiums back at 60',
        premium: 29500,
      },
      {
        id: 't-max',
        title: 'Max Cover',
        insurer: 'Jeevan Mitra Life',
        cover: '₹2 crore till age 70',
        premium: 21600,
      },
    ],
  },
  {
    key: 'motor',
    name: 'Motor insurance',
    description: 'Car and two-wheeler, zero depreciation',
    icon: 'car',
    plans: [
      {
        id: 'm-zero',
        title: 'Zero Dep Car',
        insurer: 'Suraksha General',
        cover: 'Comprehensive + zero depreciation',
        premium: 14200,
        badge: 'Best seller',
      },
      {
        id: 'm-basic',
        title: 'Third-party Car',
        insurer: 'Raksha General',
        cover: 'Mandatory third-party cover',
        premium: 3400,
      },
      {
        id: 'm-bike',
        title: 'Two-wheeler 3-year',
        insurer: 'Raksha General',
        cover: 'Comprehensive, 3 years',
        premium: 4100,
      },
    ],
  },
  {
    key: 'home',
    name: 'Home insurance',
    description: 'Structure, contents and theft',
    icon: 'home',
    plans: [
      {
        id: 'hm-full',
        title: 'Griha Complete',
        insurer: 'Suraksha General',
        cover: '₹50 lakh structure + ₹10 lakh contents',
        premium: 5900,
      },
      {
        id: 'hm-contents',
        title: 'Contents Only',
        insurer: 'Raksha General',
        cover: '₹10 lakh contents, for tenants',
        premium: 1900,
        badge: 'For renters',
      },
    ],
  },
];

export interface Advisor {
  id: string;
  topic: string;
  description: string;
  name: string;
  credentials: string;
  years: number;
}

export const ADVISORS: readonly Advisor[] = [
  {
    id: 'wealth',
    topic: 'Investments & wealth',
    description: 'Mutual funds, SIPs, goal planning',
    name: 'Radhika Mehta',
    credentials: 'CFP · SEBI-registered investment adviser',
    years: 14,
  },
  {
    id: 'tax',
    topic: 'Tax planning',
    description: 'Old vs new regime, deductions, capital gains',
    name: 'CA Pranav Desai',
    credentials: 'Chartered Accountant',
    years: 11,
  },
  {
    id: 'retirement',
    topic: 'Retirement',
    description: 'NPS, pension, how much is enough',
    name: 'Suresh Iyer',
    credentials: 'CFP · Retirement specialist',
    years: 20,
  },
  {
    id: 'loans',
    topic: 'Loans & debt',
    description: 'Balance transfer, prepayment, credit score',
    name: 'Harsh Shah',
    credentials: 'Relationship manager, loans',
    years: 9,
  },
  {
    id: 'insurance',
    topic: 'Insurance review',
    description: 'Is your family covered enough?',
    name: 'Fatima Sheikh',
    credentials: 'Licensed insurance adviser',
    years: 8,
  },
];

export interface Checklist {
  id: string;
  title: string;
  description: string;
  documents: readonly string[];
}

/** One row each; the first five get their own condition case, the last is the `else`. */
export const CHECKLISTS: readonly Checklist[] = [
  {
    id: 'home-salaried',
    title: 'Salaried home loan',
    description: 'For employees with salary slips',
    documents: [
      'PAN and Aadhaar',
      'Last 3 salary slips',
      'Form 16 for 2 years',
      '6 months bank statement',
      'Property papers and sale agreement',
    ],
  },
  {
    id: 'home-self',
    title: 'Self-employed home loan',
    description: 'For professionals and business owners',
    documents: [
      'PAN and Aadhaar',
      'ITR with computation for 3 years',
      'Audited P&L and balance sheet',
      '12 months bank statement',
      'GST registration',
      'Property papers',
    ],
  },
  {
    id: 'personal',
    title: 'Personal loan',
    description: 'Quick, mostly digital',
    documents: [
      'PAN and Aadhaar',
      'Last 3 salary slips',
      '3 months bank statement',
      'Address proof if different',
    ],
  },
  {
    id: 'business',
    title: 'Business loan',
    description: 'Working capital or expansion',
    documents: [
      'PAN of business and owners',
      'GST returns for 12 months',
      'ITR for 2 years',
      '12 months current account statement',
      'Business vintage proof',
    ],
  },
  {
    id: 'claim',
    title: 'Insurance claim',
    description: 'Health or motor claim',
    documents: [
      'Policy copy',
      'Claim form',
      'Hospital bills or repair estimate',
      'Discharge summary or FIR',
      'Cancelled cheque',
    ],
  },
  {
    id: 'kyc',
    title: 'KYC update',
    description: 'New address, name or mobile',
    documents: ['PAN', 'Aadhaar or passport', 'Recent photograph', 'Proof of the new address'],
  },
];

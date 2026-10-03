/**
 * Lexora Legal Associates' dummy catalogue: the firm, its practice areas with a lead advocate
 * and a document checklist each, a sample case and pending documents. Fictional names,
 * numbers and `.example` links; nothing here is legal advice.
 */
export const FIRM = {
  name: 'Lexora Legal Associates, Saket',
  phone: '+91 11 4060 3300',
  urgent: '+91 98100 33099',
  address: 'Suite 504, DLF South Court, Saket District Centre, New Delhi 110017',
  lat: 28.5286,
  lng: 77.2193,
  website: 'https://lexora.example',
  upload: 'https://vault.lexora.example/upload',
  video: 'https://meet.lexora.example/consult',
  review: 'https://reviews.lexora.example',
} as const;

/** The associate every escalation is handed to. */
export const ASSOCIATE = {
  agentName: 'Adv. Kavita Malhotra (Associate)',
  name: 'Adv. Kavita Malhotra',
  phone: '+91 98100 33120',
  role: 'Associate advocate',
} as const;

export interface PracticeArea {
  key: string;
  name: string;
  description: string;
  lawyer: string;
  lawyerTitle: string;
  years: number;
  /** First consultation fee, rupees. */
  fee: number;
  /** What a typical matter of this kind needs, for the checklist PDF. */
  documents: readonly string[];
}

export const PRACTICE_AREAS: readonly PracticeArea[] = [
  {
    key: 'property',
    name: 'Property & real estate',
    description: 'Title checks, sale deeds, tenancy, builder delays',
    lawyer: 'Adv. Rajiv Khanna',
    lawyerTitle: 'Partner · Real estate and RERA',
    years: 22,
    fee: 3500,
    documents: [
      'Sale deed or allotment letter',
      'Chain of title documents',
      'Encumbrance certificate',
      'Property tax receipts',
      'Builder–buyer agreement, if any',
    ],
  },
  {
    key: 'family',
    name: 'Family & matrimonial',
    description: 'Divorce, custody, maintenance, wills',
    lawyer: 'Adv. Meenal Sethi',
    lawyerTitle: 'Partner · Family law and mediation',
    years: 18,
    fee: 3000,
    documents: [
      'Marriage certificate or proof of marriage',
      "Children's birth certificates",
      'Income proof of both spouses',
      'Any earlier notices or orders',
    ],
  },
  {
    key: 'criminal',
    name: 'Criminal defence',
    description: 'Bail, FIRs, cheque bounce, cyber fraud',
    lawyer: 'Adv. Harpreet Gill',
    lawyerTitle: 'Senior counsel · Criminal trials',
    years: 25,
    fee: 5000,
    documents: [
      'Copy of the FIR or complaint',
      'Any notice received from the police',
      'Bail orders, if any',
      'Identity proof',
    ],
  },
  {
    key: 'corporate',
    name: 'Corporate & startups',
    description: 'Contracts, incorporation, shareholder issues',
    lawyer: 'Adv. Nikhil Bansal',
    lawyerTitle: 'Partner · Corporate and commercial',
    years: 14,
    fee: 4500,
    documents: [
      'Certificate of incorporation',
      'Memorandum and articles of association',
      'The contract or term sheet in question',
      'Board resolutions, if any',
    ],
  },
  {
    key: 'consumer',
    name: 'Consumer disputes',
    description: 'Defective products, services, insurance claims',
    lawyer: 'Adv. Sana Qureshi',
    lawyerTitle: 'Associate partner · Consumer forums',
    years: 10,
    fee: 2000,
    documents: [
      'Invoice or receipt',
      'Warranty or policy document',
      'Emails and complaints to the company',
      'Photos of the defect, if any',
    ],
  },
  {
    key: 'employment',
    name: 'Employment & labour',
    description: 'Wrongful termination, unpaid dues, POSH',
    lawyer: 'Adv. Arvind Menon',
    lawyerTitle: 'Partner · Employment law',
    years: 16,
    fee: 3000,
    documents: [
      'Offer and appointment letters',
      'Last three salary slips',
      'Termination or show-cause letter',
      'Relevant emails or messages',
    ],
  },
];

/** What choosing an area stores; consultation and case categories both set these. */
export const areaVars = (area: PracticeArea) => ({
  area: area.name,
  areaKey: area.key,
  lawyer: area.lawyer,
  lawyerTitle: area.lawyerTitle,
  fee: String(area.fee),
});

/** The sample matter behind document collection and case follow-up. */
export const SAMPLE_CASE = {
  title: 'Khanna Developers v. Allottees (RERA)',
  forum: 'Delhi RERA, Bench II',
  courtAddress: 'Shivaji Stadium Metro Station Building, Connaught Place, New Delhi 110001',
  courtLat: 28.6292,
  courtLng: 77.2152,
  advocate: 'Adv. Rajiv Khanna',
  stage: 'Arguments on delay compensation',
  feeDue: 15000,
} as const;

export const CASE_DOCUMENTS = [
  { id: 'allotment', name: 'Allotment letter', status: 'Received' },
  { id: 'bba', name: 'Builder–buyer agreement', status: 'Received' },
  { id: 'receipts', name: 'Payment receipts', status: 'Pending' },
  { id: 'emails', name: 'Emails with the builder', status: 'Pending' },
  { id: 'id-proof', name: 'PAN and Aadhaar copy', status: 'Pending' },
  { id: 'photos', name: 'Site photos', status: 'Pending' },
] as const;

export const HEARINGS = [
  { id: 'h1', date: '12 Jun', purpose: 'Filing and admission', outcome: 'Admitted' },
  { id: 'h2', date: '28 Jul', purpose: 'Builder reply', outcome: 'Reply filed' },
  { id: 'h3', date: '9 Sep', purpose: 'Rejoinder', outcome: 'Rejoinder filed' },
] as const;

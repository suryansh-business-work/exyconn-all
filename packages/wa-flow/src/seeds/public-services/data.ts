/**
 * Sundarpur Civic Centre's dummy catalogue — a fictional municipal office: its offices, the
 * services citizens book counter tokens for (fees, timelines and document checklists), and
 * the civic issues they can report. No real government names, emblems or numbers.
 */
import { rupees } from '../healthcare/data';

export const CIVIC = {
  name: 'Sundarpur Civic Centre',
  phone: '+91 755 400 4400',
  helpline: '+91 755 400 4455',
  address: 'Civic Centre, Station Road, Sundarpur 462001',
  lat: 23.2599,
  lng: 77.4126,
  website: 'https://sundarpur-civic.example',
  forms: 'https://sundarpur-civic.example/forms',
  pay: 'https://sundarpur-civic.example/pay',
  track: 'https://sundarpur-civic.example/track',
} as const;

export const HELP_DESK = {
  agentName: 'Officer Rekha Verma (Help desk)',
  name: 'Rekha Verma',
  role: 'Citizen Facilitation Officer',
  phone: CIVIC.helpline,
} as const;

export interface Office {
  id: string;
  name: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
}

export const OFFICES: readonly Office[] = [
  {
    id: 'hq',
    name: 'Civic Centre HQ',
    area: 'Station Road · all services',
    address: CIVIC.address,
    lat: CIVIC.lat,
    lng: CIVIC.lng,
  },
  {
    id: 'north',
    name: 'North Zone Office',
    area: 'Shanti Nagar · wards 1–18',
    address: 'Zone Office, 2nd Cross, Shanti Nagar, Sundarpur 462003',
    lat: 23.2861,
    lng: 77.4012,
  },
  {
    id: 'lake',
    name: 'Lake View Ward Office',
    area: 'Lake Road · wards 19–36',
    address: 'Ward Office, Lake Road, near Boat Club, Sundarpur 462016',
    lat: 23.2443,
    lng: 77.3829,
  },
  {
    id: 'industrial',
    name: 'Industrial Area Office',
    area: 'Sector C · wards 37–52',
    address: 'Sector C Community Hall, Industrial Area, Sundarpur 462021',
    lat: 23.2135,
    lng: 77.4527,
  },
];

export interface CivicService {
  id: string;
  title: string;
  description: string;
  counter: string;
  /** Fee in rupees; 0 when free. */
  fee: number;
  timeline: string;
  documents: readonly { id: string; doc: string; note: string }[];
}

/** Six services get a checklist case each; Trade licence is the condition's `else`. */
export const SERVICES: readonly CivicService[] = [
  {
    id: 'birth',
    title: 'Birth certificate',
    description: 'New certificate, correction or extra copies',
    counter: 'Counter 3',
    fee: 50,
    timeline: '7 working days',
    documents: [
      { id: 'hospital', doc: 'Hospital discharge slip', note: 'Or a letter from the hospital' },
      {
        id: 'parents-id',
        doc: "Parents' photo ID",
        note: 'Aadhaar (masked), voter ID or passport',
      },
      { id: 'address', doc: 'Address proof', note: 'Electricity bill or rent agreement' },
      { id: 'marriage', doc: "Parents' marriage certificate", note: 'Optional, helps for names' },
    ],
  },
  {
    id: 'death',
    title: 'Death certificate',
    description: 'Registration and certified copies',
    counter: 'Counter 3',
    fee: 50,
    timeline: '7 working days',
    documents: [
      { id: 'medical', doc: 'Medical cause-of-death form', note: 'From the hospital or doctor' },
      { id: 'deceased-id', doc: 'Photo ID of the deceased', note: 'Any government photo ID' },
      { id: 'applicant-id', doc: 'Your photo ID', note: 'Applicant must be family' },
      { id: 'cremation', doc: 'Cremation or burial slip', note: 'From the ground or trust' },
    ],
  },
  {
    id: 'property-tax',
    title: 'Property tax',
    description: 'Assessment, name transfer or payment help',
    counter: 'Counter 7',
    fee: 0,
    timeline: 'Same day',
    documents: [
      { id: 'last-receipt', doc: 'Last tax receipt', note: 'Shows your property ID' },
      { id: 'sale-deed', doc: 'Sale deed or allotment letter', note: 'For a new assessment' },
      { id: 'owner-id', doc: "Owner's photo ID", note: 'Aadhaar (masked) or PAN' },
    ],
  },
  {
    id: 'water',
    title: 'Water connection',
    description: 'New connection, transfer or meter change',
    counter: 'Counter 9',
    fee: 1500,
    timeline: '15 working days',
    documents: [
      { id: 'tax-paid', doc: 'Property tax paid receipt', note: 'For the current year' },
      { id: 'ownership', doc: 'Ownership or rent proof', note: 'Rent needs owner NOC' },
      { id: 'plumber', doc: 'Licensed plumber estimate', note: 'Form W-2' },
      { id: 'photo', doc: 'Passport photo', note: 'One recent photo' },
    ],
  },
  {
    id: 'marriage-reg',
    title: 'Marriage registration',
    description: 'Register a marriage and get the certificate',
    counter: 'Counter 5',
    fee: 100,
    timeline: '10 working days',
    documents: [
      { id: 'invite', doc: 'Wedding invitation or photo', note: 'Any one proof of ceremony' },
      { id: 'age', doc: 'Age proof of both', note: 'Birth certificate or Class 10 mark sheet' },
      { id: 'ids', doc: 'Photo IDs of both', note: 'And of two witnesses' },
      { id: 'photos', doc: 'Joint passport photos', note: 'Two copies' },
    ],
  },
  {
    id: 'building',
    title: 'Building plan approval',
    description: 'New construction or extension permits',
    counter: 'Counter 11',
    fee: 5000,
    timeline: '30 working days',
    documents: [
      { id: 'drawings', doc: 'Architect drawings', note: 'Signed, in PDF and print' },
      { id: 'title', doc: 'Title documents', note: 'Sale deed and mutation' },
      { id: 'structural', doc: 'Structural safety certificate', note: 'Above 2 floors' },
      { id: 'noc', doc: 'Fire NOC', note: 'Above 15 metres' },
    ],
  },
];

export const TRADE_LICENCE: CivicService = {
  id: 'trade',
  title: 'Trade licence',
  description: 'New shop or business licence and renewals',
  counter: 'Counter 8',
  fee: 750,
  timeline: '10 working days',
  documents: [
    { id: 'premises', doc: 'Premises ownership or rent proof', note: 'With owner NOC' },
    { id: 'owner-id', doc: "Owner's photo ID", note: 'Aadhaar (masked) or PAN' },
    { id: 'gst', doc: 'GST registration', note: 'If registered' },
    { id: 'layout', doc: 'Shop layout sketch', note: 'Hand-drawn is fine' },
  ],
};

export const ALL_SERVICES: readonly CivicService[] = [...SERVICES, TRADE_LICENCE];

export interface IssueCategory {
  id: string;
  title: string;
  description: string;
  department: string;
  sla: string;
}

export const ISSUES: readonly IssueCategory[] = [
  {
    id: 'streetlight',
    title: 'Streetlight',
    description: 'Not working, flickering or on in the day',
    department: 'Electrical',
    sla: '48 hours',
  },
  {
    id: 'garbage',
    title: 'Garbage',
    description: 'Not collected, overflowing bins, dumping',
    department: 'Sanitation',
    sla: '24 hours',
  },
  {
    id: 'water',
    title: 'Water supply',
    description: 'No water, low pressure, leaks, dirty water',
    department: 'Water Works',
    sla: '24 hours',
  },
  {
    id: 'roads',
    title: 'Roads & potholes',
    description: 'Potholes, broken footpaths, debris',
    department: 'Public Works',
    sla: '7 days',
  },
  {
    id: 'drainage',
    title: 'Drainage',
    description: 'Blocked drains, sewage overflow, waterlogging',
    department: 'Drainage',
    sla: '48 hours',
  },
  {
    id: 'other',
    title: 'Something else',
    description: 'Stray animals, trees, noise and more',
    department: 'Ward Office',
    sla: '5 days',
  },
];

/** A service as a list row; picking it stores everything the token and checklist flows show. */
export function serviceRow(service: CivicService) {
  const feeLabel = service.fee > 0 ? rupees(service.fee) : 'Free';
  return {
    id: service.id,
    title: service.title,
    description: `${service.description} · ${feeLabel}`,
    set: {
      service: service.title,
      serviceId: service.id,
      counter: service.counter,
      fee: String(service.fee),
      feeLabel,
      timeline: service.timeline,
    },
  };
}

/**
 * FitNation's dummy catalogue: the chain, its branches, fitness goals, personal trainers and
 * packs, yoga classes, membership plans and add-ons. Fictional names, numbers and links.
 */
import type { IconKey } from '../../visuals';

export const GYM = {
  phone: '+91 22 6800 4400',
  address: 'Link Square, 3rd floor, Linking Road, Andheri West, Mumbai 400058',
  website: 'https://fitnation.example',
  online: 'https://live.fitnation.example',
  review: 'https://reviews.fitnation.example',
} as const;

/** The membership desk every freeze or plan question is handed to. */
export const MEMBERSHIP_DESK = {
  agentName: 'Nikita (Membership desk)',
  name: 'Nikita Desai',
  phone: '+91 98200 44101',
  role: 'Membership manager',
} as const;

/** The PT desk that relays calls to the coaches. */
export const PT_DESK = { phone: '+91 98200 44188' } as const;

export interface Branch {
  id: string;
  name: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
}

export const BRANCHES: readonly Branch[] = [
  {
    id: 'andheri',
    name: 'FitNation Andheri West',
    area: 'Linking Road · open 5 am – 11 pm',
    address: GYM.address,
    lat: 19.1364,
    lng: 72.8296,
  },
  {
    id: 'powai',
    name: 'FitNation Powai',
    area: 'Hiranandani Gardens · pool and sauna',
    address: 'Galleria Annexe, Hiranandani Gardens, Powai, Mumbai 400076',
    lat: 19.1176,
    lng: 72.9078,
  },
  {
    id: 'bandra',
    name: 'FitNation Bandra',
    area: 'Hill Road · yoga and CrossFit studio',
    address: '78 Hill Road, Bandra West, Mumbai 400050',
    lat: 19.0544,
    lng: 72.8335,
  },
  {
    id: 'thane',
    name: 'FitNation Thane',
    area: 'Ghodbunder Road · 24×7 access',
    address: 'Vihang Plaza, Ghodbunder Road, Thane West 400615',
    lat: 19.2307,
    lng: 72.9726,
  },
  {
    id: 'vashi',
    name: 'FitNation Vashi',
    area: 'Sector 17 · ladies-only floor',
    address: 'Palm Court, Sector 17, Vashi, Navi Mumbai 400703',
    lat: 19.0745,
    lng: 72.9978,
  },
];

export const GOALS = [
  { id: 'fat-loss', title: 'Lose weight', description: 'Burn fat with cardio and strength' },
  { id: 'muscle', title: 'Build muscle', description: 'Strength and hypertrophy training' },
  { id: 'fitness', title: 'Get fitter', description: 'Stamina, mobility, everyday energy' },
  { id: 'sport', title: 'Sport performance', description: 'Speed, agility, power for your sport' },
  { id: 'rehab', title: 'Recover from injury', description: 'Low-impact, physio-guided training' },
] as const;

export interface Trainer {
  id: string;
  name: string;
  speciality: string;
  cert: string;
  years: number;
  /** Per-session rate on a single session, rupees. */
  rate: number;
  badge?: string;
}

export const TRAINERS: readonly Trainer[] = [
  {
    id: 'rahul',
    name: 'Rahul Shetty',
    speciality: 'Strength and muscle gain',
    cert: 'ACE-CPT',
    years: 9,
    rate: 1200,
    badge: 'Top rated',
  },
  {
    id: 'aisha',
    name: 'Aisha Khan',
    speciality: 'Fat loss and functional training',
    cert: 'NASM-CPT',
    years: 7,
    rate: 1100,
  },
  {
    id: 'vikram',
    name: 'Vikram Singh',
    speciality: 'Sport and athletic conditioning',
    cert: 'NSCA-CSCS',
    years: 11,
    rate: 1500,
    badge: 'Athlete coach',
  },
  {
    id: 'pooja',
    name: 'Pooja Menon',
    speciality: 'Post-injury and senior fitness',
    cert: 'ACSM-EP · Physio',
    years: 8,
    rate: 1300,
  },
];

export const PT_PACKS = [
  {
    id: 'pt-1',
    title: 'Single session',
    description: 'Try it once · 60 minutes',
    sessions: 1,
    price: 1200,
  },
  {
    id: 'pt-8',
    title: '8 sessions',
    description: '2 a week for a month · save 10%',
    sessions: 8,
    price: 8640,
  },
  {
    id: 'pt-12',
    title: '12 sessions',
    description: '3 a week for a month · save 15%',
    sessions: 12,
    price: 12240,
  },
  {
    id: 'pt-24',
    title: '24 sessions',
    description: 'Two months · save 20% + diet plan',
    sessions: 24,
    price: 23040,
  },
] as const;

export interface YogaClass {
  id: string;
  title: string;
  description: string;
  level: string;
  minutes: number;
  /** Drop-in price, rupees. */
  price: number;
  icon: IconKey;
}

export const YOGA_CLASSES: readonly YogaClass[] = [
  {
    id: 'hatha',
    title: 'Hatha Yoga',
    description: 'Classic postures and breathing',
    level: 'All levels',
    minutes: 60,
    price: 499,
    icon: 'spa',
  },
  {
    id: 'vinyasa',
    title: 'Vinyasa Flow',
    description: 'Breath-led flowing sequences',
    level: 'Intermediate',
    minutes: 60,
    price: 549,
    icon: 'fitness',
  },
  {
    id: 'power',
    title: 'Power Yoga',
    description: 'Strength and sweat, fast pace',
    level: 'Intermediate',
    minutes: 45,
    price: 549,
    icon: 'fitness',
  },
  {
    id: 'yin',
    title: 'Yin & Stretch',
    description: 'Long holds for flexibility',
    level: 'All levels',
    minutes: 60,
    price: 449,
    icon: 'spa',
  },
  {
    id: 'prenatal',
    title: 'Prenatal Yoga',
    description: 'Safe practice in pregnancy',
    level: 'Beginner',
    minutes: 60,
    price: 599,
    icon: 'baby',
  },
  {
    id: 'meditation',
    title: 'Pranayama & Meditation',
    description: 'Breathwork and guided calm',
    level: 'All levels',
    minutes: 30,
    price: 299,
    icon: 'brain',
  },
];

/** Pass prices in rupees; a drop-in costs the class's own price. */
export const YOGA_PASSES = {
  tenClass: { title: '10-class pass', label: '10 classes in 60 days', price: 3999 },
  unlimited: { title: 'Unlimited month', label: 'Unlimited classes for 30 days', price: 4499 },
} as const;

export interface Plan {
  id: string;
  title: string;
  subtitle: string;
  months: number;
  price: number;
  mrp: number;
  badge?: string;
}

export const PLANS: readonly Plan[] = [
  {
    id: 'monthly',
    title: 'Monthly',
    subtitle: 'All branches · gym + group classes',
    months: 1,
    price: 2999,
    mrp: 3500,
  },
  {
    id: 'quarterly',
    title: 'Quarterly',
    subtitle: '3 months · 1 free PT session',
    months: 3,
    price: 7999,
    mrp: 10500,
    badge: 'Save 24%',
  },
  {
    id: 'half-yearly',
    title: 'Half-yearly',
    subtitle: '6 months · 2 PT sessions, 15-day freeze',
    months: 6,
    price: 13999,
    mrp: 21000,
    badge: 'Popular',
  },
  {
    id: 'annual',
    title: 'Annual',
    subtitle: '12 months · 4 PT sessions, 30-day freeze',
    months: 12,
    price: 23999,
    mrp: 42000,
    badge: 'Best value',
  },
];

export const ADD_ONS = [
  { id: 'none', title: 'No add-on', description: 'Just the plan', price: 0 },
  {
    id: 'locker',
    title: 'Personal locker',
    description: 'Your own locker for the plan',
    price: 1500,
  },
  {
    id: 'steam',
    title: 'Steam & sauna',
    description: 'Unlimited, at Powai and Bandra',
    price: 2500,
  },
  {
    id: 'diet',
    title: 'Nutrition plan',
    description: 'Dietitian consult + monthly plan',
    price: 3000,
  },
] as const;

/** GST on fitness services, as a whole-rupee amount. */
export const gstOn = (amount: number): number => Math.round(amount * 0.18);

/** Codes the renewal accepts; `amount` is rupees off. */
export const COUPONS = [
  { id: 'fit500', code: 'FIT500', amount: 500, label: 'Code FIT500' },
  { id: 'refer', code: 'REFER1000', amount: 1000, label: 'Referral REFER1000' },
  { id: 'loyal', code: 'LOYAL15', amount: 1500, label: 'Loyalty LOYAL15' },
] as const;

/** The member's current plan, shown before a renewal. */
export const CURRENT_PLAN = { id: 'quarterly', visits: 38, ptLeft: 1, expiresInDays: 5 } as const;

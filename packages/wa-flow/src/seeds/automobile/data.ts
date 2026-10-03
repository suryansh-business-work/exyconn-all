/**
 * AutoNova Motors' dummy catalogue: the dealership and workshop, service packages, the cars
 * on test drive, pickup charges and a sample job card. Fictional names, numbers and links.
 */
import type { IconKey } from '../../visuals';

export const DEALER = {
  name: 'AutoNova Motors, Baner',
  workshop: 'AutoNova Service Centre, Baner',
  phone: '+91 20 4100 2200',
  roadside: '+91 20 4100 2299',
  address: 'Survey No. 42, Baner–Pashan Link Road, Baner, Pune 411045',
  lat: 18.5642,
  lng: 73.7769,
  website: 'https://autonova.example',
  brochure: 'https://autonova.example/brochures',
  directions: 'https://maps.autonova.example/baner',
  review: 'https://reviews.autonova.example/baner',
  tracking: 'https://track.autonova.example',
} as const;

/** The service advisor every workshop escalation is handed to. */
export const SERVICE_ADVISOR = {
  agentName: 'Rohit Patil (Service advisor)',
  name: 'Rohit Patil',
  phone: '+91 98220 41100',
  role: 'Senior service advisor',
} as const;

/** The sales consultant test drives are handed to. */
export const SALES_CONSULTANT = {
  agentName: 'Sneha Kulkarni (Sales)',
  name: 'Sneha Kulkarni',
  phone: '+91 98220 41155',
  role: 'Sales consultant',
} as const;

/** The pickup driver assigned to doorstep requests. */
export const PICKUP_DRIVER = {
  name: 'Ganesh Jadhav',
  phone: '+91 98500 77120',
  role: 'Pickup & drop driver',
  vehicle: 'MH 12 QR 4471',
} as const;

export interface ServicePackage {
  id: string;
  title: string;
  subtitle: string;
  /** Rupees, labour plus standard consumables. */
  price: number;
  mrp: number;
  hours: string;
  icon: IconKey;
  badge?: string;
}

export const PERIODIC_SERVICES: readonly ServicePackage[] = [
  {
    id: 'periodic',
    title: 'Periodic service',
    subtitle: 'Oil, filters, 40-point inspection, wash',
    price: 4499,
    mrp: 5800,
    hours: '5 hours',
    icon: 'tools',
    badge: 'Most booked',
  },
  {
    id: 'express',
    title: 'Express service',
    subtitle: 'Oil and filter change, top-ups, 60 minutes',
    price: 2799,
    mrp: 3400,
    hours: '1 hour',
    icon: 'clock',
  },
  {
    id: 'comprehensive',
    title: 'Comprehensive service',
    subtitle: 'Periodic + brakes, spark plugs, coolant flush',
    price: 7999,
    mrp: 9800,
    hours: '7 hours',
    icon: 'check',
    badge: 'Save ₹1,800',
  },
];

export const REPAIR_SERVICES: readonly ServicePackage[] = [
  {
    id: 'ac',
    title: 'AC service',
    subtitle: 'Gas top-up, cooling coil and cabin filter',
    price: 1999,
    mrp: 2600,
    hours: '3 hours',
    icon: 'electricity',
  },
  {
    id: 'alignment',
    title: 'Wheel alignment',
    subtitle: 'Alignment, balancing and tyre rotation',
    price: 999,
    mrp: 1400,
    hours: '90 minutes',
    icon: 'car',
  },
  {
    id: 'brakes',
    title: 'Brake check & pads',
    subtitle: 'Front pads, disc skimming, fluid check',
    price: 3299,
    mrp: 4100,
    hours: '3 hours',
    icon: 'warning',
  },
  {
    id: 'battery',
    title: 'Battery health',
    subtitle: 'Load test, terminals; new battery quoted',
    price: 299,
    mrp: 500,
    hours: '30 minutes',
    icon: 'electricity',
  },
  {
    id: 'detailing',
    title: 'Interior detailing',
    subtitle: 'Deep clean, upholstery shampoo, polish',
    price: 2499,
    mrp: 3200,
    hours: '4 hours',
    icon: 'star',
  },
];

export interface CarModel {
  id: string;
  name: string;
  body: string;
  /** Ex-showroom from, rupees. */
  price: number;
  fuel: string;
  mileage: string;
  badge?: string;
  icon: IconKey;
}

export const CARS: readonly CarModel[] = [
  {
    id: 'zest',
    name: 'Nova Zest',
    body: 'Hatchback · 5 seats',
    price: 649000,
    fuel: 'Petrol / CNG',
    mileage: '22 km/l',
    badge: 'Bestseller',
    icon: 'car',
  },
  {
    id: 'aria',
    name: 'Nova Aria',
    body: 'Sedan · 5 seats',
    price: 989000,
    fuel: 'Petrol / Diesel',
    mileage: '19 km/l',
    icon: 'car',
  },
  {
    id: 'terra',
    name: 'Nova Terra',
    body: 'Compact SUV · 5 seats',
    price: 1149000,
    fuel: 'Petrol / Diesel',
    mileage: '17 km/l',
    badge: 'New launch',
    icon: 'car',
  },
  {
    id: 'grand',
    name: 'Nova Grand',
    body: 'SUV · 7 seats',
    price: 1699000,
    fuel: 'Diesel · AT',
    mileage: '15 km/l',
    icon: 'truck',
  },
  {
    id: 'volt',
    name: 'Nova Volt EV',
    body: 'Electric SUV · 5 seats',
    price: 1849000,
    fuel: 'Electric · 465 km range',
    mileage: '465 km/charge',
    badge: 'Zero emission',
    icon: 'electricity',
  },
];

/** Doorstep pickup and drop, rupees. */
export const PICKUP_OPTIONS = [
  { id: 'both', title: 'Pickup + drop', fee: 499 },
  { id: 'pickup', title: 'Pickup only', fee: 299 },
  { id: 'drop', title: 'Drop only', fee: 299 },
] as const;

/** Extra work found during a service, awaiting the customer's approval. */
export const EXTRA_WORK = [
  { id: 'wiper', name: 'Wiper blades (pair)', qty: 1, price: 890 },
  { id: 'pads', name: 'Rear brake shoes', qty: 1, price: 2150 },
] as const;

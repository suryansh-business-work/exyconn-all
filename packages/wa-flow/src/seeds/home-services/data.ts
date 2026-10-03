/**
 * HomeEase Services' dummy catalogue: the company, its service categories (each with a lead
 * technician and a rate card), annual care plans, cancellation reasons and the invoice lines
 * the post-service flow shows. Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const COMPANY = {
  name: 'HomeEase Services',
  phone: '+91 20 4100 2200',
  emergency: '+91 20 4100 2911',
  address: 'Office 402, Baner Business Bay, Baner Road, Pune 411045',
  lat: 18.559,
  lng: 73.7868,
  website: 'https://homeease.example',
  track: 'https://homeease.example/track',
  review: 'https://reviews.homeease.example/pune',
  safety: 'https://homeease.example/safety',
  plans: 'https://homeease.example/care-plans',
} as const;

/** The support desk every escalation is handed to. */
export const SUPPORT = {
  agentName: 'Kavita (HomeEase support)',
  name: 'Kavita Deshmukh',
  phone: '+91 20 4100 2250',
  role: 'Customer support lead',
} as const;

/** The on-call emergency desk (gas smell, sparking, flooding). */
export const EMERGENCY_DESK = {
  agentName: 'Sandeep (Emergency desk)',
  name: 'Sandeep Patil',
  phone: '+91 20 4100 2911',
  role: 'On-call supervisor, 24×7',
} as const;

/** Where the assigned technician "is" on the live-tracking pin. */
export const TECH_LIVE = { lat: 18.5642, lng: 73.7769 } as const;

export interface Technician {
  name: string;
  phone: string;
  rating: string;
  jobs: number;
  years: number;
}

export interface Service {
  id: string;
  /** Row title — 24 characters at most. */
  title: string;
  /** Price in rupees (visit + labour; parts extra at MRP). */
  price: number;
  mrp: number;
  duration: string;
  warranty: string;
}

export interface Category {
  key: string;
  name: string;
  description: string;
  icon: IconKey;
  technician: Technician;
  services: readonly Service[];
}

export const CATEGORIES: readonly Category[] = [
  {
    key: 'plumbing',
    name: 'Plumbing',
    description: 'Leaks, taps, blockages, tanks and bathroom fittings',
    icon: 'water',
    technician: {
      name: 'Ramesh Jadhav',
      phone: '+91 98220 41101',
      rating: '4.8',
      jobs: 2140,
      years: 12,
    },
    services: [
      {
        id: 'tap-repair',
        title: 'Tap & mixer repair',
        price: 149,
        mrp: 199,
        duration: '30 min',
        warranty: '30 days',
      },
      {
        id: 'leak-fix',
        title: 'Pipe leak repair',
        price: 249,
        mrp: 349,
        duration: '45 min',
        warranty: '30 days',
      },
      {
        id: 'drain-block',
        title: 'Drain blockage removal',
        price: 299,
        mrp: 399,
        duration: '45 min',
        warranty: '15 days',
      },
      {
        id: 'flush-repair',
        title: 'Flush tank repair',
        price: 279,
        mrp: 349,
        duration: '45 min',
        warranty: '30 days',
      },
      {
        id: 'tank-clean',
        title: 'Water tank cleaning',
        price: 799,
        mrp: 1100,
        duration: '2 hrs',
        warranty: '7 days',
      },
      {
        id: 'geyser-install',
        title: 'Geyser installation',
        price: 449,
        mrp: 599,
        duration: '1 hr',
        warranty: '90 days',
      },
    ],
  },
  {
    key: 'electrical',
    name: 'Electrical',
    description: 'Switches, wiring, fans, lights, MCB and inverters',
    icon: 'electricity',
    technician: {
      name: 'Imran Shaikh',
      phone: '+91 98220 41102',
      rating: '4.9',
      jobs: 3015,
      years: 15,
    },
    services: [
      {
        id: 'switch-repair',
        title: 'Switch & socket repair',
        price: 99,
        mrp: 149,
        duration: '20 min',
        warranty: '30 days',
      },
      {
        id: 'fan-install',
        title: 'Ceiling fan install',
        price: 199,
        mrp: 249,
        duration: '40 min',
        warranty: '30 days',
      },
      {
        id: 'light-fitting',
        title: 'Light fitting install',
        price: 149,
        mrp: 199,
        duration: '30 min',
        warranty: '30 days',
      },
      {
        id: 'mcb-fix',
        title: 'MCB / fuse repair',
        price: 249,
        mrp: 299,
        duration: '30 min',
        warranty: '30 days',
      },
      {
        id: 'wiring',
        title: 'Room wiring check',
        price: 499,
        mrp: 699,
        duration: '1.5 hrs',
        warranty: '90 days',
      },
      {
        id: 'inverter',
        title: 'Inverter installation',
        price: 599,
        mrp: 799,
        duration: '1 hr',
        warranty: '90 days',
      },
    ],
  },
  {
    key: 'ac',
    name: 'AC repair & service',
    description: 'Split and window AC: service, gas refill, install',
    icon: 'tools',
    technician: {
      name: 'Vinod Kale',
      phone: '+91 98220 41103',
      rating: '4.7',
      jobs: 1876,
      years: 9,
    },
    services: [
      {
        id: 'ac-service',
        title: 'AC power-jet service',
        price: 599,
        mrp: 799,
        duration: '1 hr',
        warranty: '30 days',
      },
      {
        id: 'ac-repair',
        title: 'AC not cooling check',
        price: 349,
        mrp: 449,
        duration: '45 min',
        warranty: '30 days',
      },
      {
        id: 'gas-refill',
        title: 'AC gas refill (R32)',
        price: 2499,
        mrp: 3200,
        duration: '1.5 hrs',
        warranty: '90 days',
      },
      {
        id: 'ac-install',
        title: 'Split AC installation',
        price: 1499,
        mrp: 1899,
        duration: '2 hrs',
        warranty: '180 days',
      },
      {
        id: 'ac-uninstall',
        title: 'AC uninstallation',
        price: 699,
        mrp: 899,
        duration: '1 hr',
        warranty: '7 days',
      },
    ],
  },
  {
    key: 'cleaning',
    name: 'Cleaning',
    description: 'Deep cleaning for homes, kitchens, bathrooms and sofas',
    icon: 'home',
    technician: {
      name: 'Sunita Pawar',
      phone: '+91 98220 41104',
      rating: '4.8',
      jobs: 2560,
      years: 7,
    },
    services: [
      {
        id: 'clean-1bhk',
        title: '1 BHK deep cleaning',
        price: 2999,
        mrp: 3999,
        duration: '4 hrs',
        warranty: '48 hrs re-do',
      },
      {
        id: 'clean-2bhk',
        title: '2 BHK deep cleaning',
        price: 3999,
        mrp: 5299,
        duration: '6 hrs',
        warranty: '48 hrs re-do',
      },
      {
        id: 'clean-3bhk',
        title: '3 BHK deep cleaning',
        price: 4999,
        mrp: 6499,
        duration: '8 hrs',
        warranty: '48 hrs re-do',
      },
      {
        id: 'kitchen-clean',
        title: 'Kitchen deep cleaning',
        price: 1499,
        mrp: 1999,
        duration: '3 hrs',
        warranty: '48 hrs re-do',
      },
      {
        id: 'bathroom-clean',
        title: 'Bathroom deep cleaning',
        price: 499,
        mrp: 699,
        duration: '1 hr',
        warranty: '48 hrs re-do',
      },
      {
        id: 'sofa-clean',
        title: 'Sofa shampooing (5 seat)',
        price: 899,
        mrp: 1199,
        duration: '1.5 hrs',
        warranty: '48 hrs re-do',
      },
    ],
  },
  {
    key: 'appliance',
    name: 'Appliance repair',
    description: 'Washing machine, fridge, RO purifier, microwave',
    icon: 'laptop',
    technician: {
      name: 'Nitin Bhosale',
      phone: '+91 98220 41105',
      rating: '4.6',
      jobs: 1432,
      years: 10,
    },
    services: [
      {
        id: 'wm-repair',
        title: 'Washing machine repair',
        price: 349,
        mrp: 449,
        duration: '1 hr',
        warranty: '30 days',
      },
      {
        id: 'fridge-repair',
        title: 'Refrigerator repair',
        price: 399,
        mrp: 499,
        duration: '1 hr',
        warranty: '30 days',
      },
      {
        id: 'ro-service',
        title: 'RO purifier service',
        price: 449,
        mrp: 599,
        duration: '45 min',
        warranty: '30 days',
      },
      {
        id: 'micro-repair',
        title: 'Microwave repair',
        price: 299,
        mrp: 399,
        duration: '45 min',
        warranty: '30 days',
      },
      {
        id: 'chimney-clean',
        title: 'Chimney deep cleaning',
        price: 999,
        mrp: 1299,
        duration: '1.5 hrs',
        warranty: '15 days',
      },
    ],
  },
  {
    key: 'carpentry',
    name: 'Carpentry',
    description: 'Door locks, hinges, furniture assembly and repairs',
    icon: 'key',
    technician: {
      name: 'Mahesh Suthar',
      phone: '+91 98220 41106',
      rating: '4.7',
      jobs: 1290,
      years: 18,
    },
    services: [
      {
        id: 'lock-fix',
        title: 'Door lock replacement',
        price: 249,
        mrp: 299,
        duration: '30 min',
        warranty: '30 days',
      },
      {
        id: 'hinge-fix',
        title: 'Hinge & channel repair',
        price: 199,
        mrp: 249,
        duration: '30 min',
        warranty: '30 days',
      },
      {
        id: 'furniture',
        title: 'Furniture assembly',
        price: 499,
        mrp: 649,
        duration: '1.5 hrs',
        warranty: '30 days',
      },
      {
        id: 'curtain-rod',
        title: 'Curtain rod install',
        price: 149,
        mrp: 199,
        duration: '30 min',
        warranty: '30 days',
      },
    ],
  },
  {
    key: 'pest-control',
    name: 'Pest control',
    description: 'Cockroach, ants, bed bugs and termite treatment',
    icon: 'plant',
    technician: {
      name: 'Anil Gaikwad',
      phone: '+91 98220 41107',
      rating: '4.7',
      jobs: 1688,
      years: 11,
    },
    services: [
      {
        id: 'cockroach',
        title: 'Cockroach & ant control',
        price: 899,
        mrp: 1199,
        duration: '1 hr',
        warranty: '90 days',
      },
      {
        id: 'bed-bugs',
        title: 'Bed bug treatment',
        price: 1499,
        mrp: 1999,
        duration: '2 hrs',
        warranty: '30 days',
      },
      {
        id: 'termite',
        title: 'Termite treatment',
        price: 3499,
        mrp: 4499,
        duration: '3 hrs',
        warranty: '1 year',
      },
      {
        id: 'mosquito',
        title: 'Mosquito fogging',
        price: 699,
        mrp: 899,
        duration: '45 min',
        warranty: '15 days',
      },
    ],
  },
];

/** What a free-text problem maps to in the AI flow: a category and a starter service. */
export interface QuickFix {
  intent: string;
  description: string;
  categoryKey: string;
  serviceId: string;
}

export const QUICK_FIXES: readonly QuickFix[] = [
  {
    intent: 'plumbing',
    description: 'Water leaks, dripping taps, blocked drains, flush or tank problems',
    categoryKey: 'plumbing',
    serviceId: 'leak-fix',
  },
  {
    intent: 'electrical',
    description: 'Switches, sockets, fans, lights, tripping MCB or wiring problems',
    categoryKey: 'electrical',
    serviceId: 'mcb-fix',
  },
  {
    intent: 'ac',
    description: 'Air conditioner not cooling, leaking water, noisy, or due for a service',
    categoryKey: 'ac',
    serviceId: 'ac-repair',
  },
  {
    intent: 'cleaning',
    description: 'Home, kitchen, bathroom or sofa cleaning',
    categoryKey: 'cleaning',
    serviceId: 'kitchen-clean',
  },
  {
    intent: 'appliance',
    description: 'Washing machine, fridge, RO water purifier, microwave or chimney trouble',
    categoryKey: 'appliance',
    serviceId: 'wm-repair',
  },
  {
    intent: 'carpentry',
    description: 'Door locks, hinges, drawers, furniture assembly or curtain rods',
    categoryKey: 'carpentry',
    serviceId: 'lock-fix',
  },
  {
    intent: 'pests',
    description: 'Cockroaches, ants, bed bugs, termites or mosquitoes',
    categoryKey: 'pest-control',
    serviceId: 'cockroach',
  },
];

export interface CarePlan {
  id: string;
  title: string;
  subtitle: string;
  /** Yearly price in rupees, per unit when `perUnit` is set. */
  price: number;
  mrp: number;
  badge?: string;
  icon: IconKey;
  visits: string;
  covers: string;
  /** e.g. "AC" — the plan is priced per appliance; undefined for a whole-home plan. */
  perUnit?: string;
}

export const CARE_PLANS: readonly CarePlan[] = [
  {
    id: 'ac-care',
    title: 'AC Care plan',
    subtitle: '3 services a year, free gas top-up, priority visits',
    price: 1999,
    mrp: 2799,
    badge: 'Bestseller',
    icon: 'tools',
    visits: '3 services + unlimited breakdown visits',
    covers: 'Power-jet service, gas top-up up to 300 g, labour on repairs',
    perUnit: 'AC',
  },
  {
    id: 'ro-care',
    title: 'RO Care plan',
    subtitle: '2 filter changes a year, unlimited repair visits',
    price: 1499,
    mrp: 2199,
    icon: 'water',
    visits: '2 services + unlimited breakdown visits',
    covers: 'Sediment and carbon filter changes, TDS check, labour on repairs',
    perUnit: 'purifier',
  },
  {
    id: 'home-plus',
    title: 'Home Care Plus',
    subtitle: 'Plumbing + electrical cover and 2 deep cleans',
    price: 4999,
    mrp: 7499,
    badge: 'Save 33%',
    icon: 'home',
    visits: '12 plumber/electrician visits + 2 kitchen deep cleans',
    covers: 'Labour on all plumbing and electrical jobs, 10% off spare parts',
  },
  {
    id: 'pest-shield',
    title: 'Pest Shield',
    subtitle: 'Quarterly cockroach and ant treatment',
    price: 2999,
    mrp: 3999,
    icon: 'plant',
    visits: '4 treatments, one every quarter',
    covers: 'Gel and spray treatment for kitchen, bathrooms and balconies',
  },
];

/** Why a customer cancels; any reason leads to the same confirmation. */
export const CANCEL_REASONS = [
  { id: 'fixed', title: 'Problem got fixed' },
  { id: 'time', title: 'Slot does not suit me' },
  { id: 'price', title: 'Found it too expensive' },
  { id: 'other-pro', title: 'Booked someone else' },
  { id: 'other', title: 'Other reason' },
] as const;

/** The completed job the invoice flow shows. */
export const LAST_JOB = {
  service: 'AC power-jet service',
  technician: 'Vinod Kale',
  lines: [
    { id: 'labour', cells: ['AC power-jet service (split, 1.5 T)', '1', '₹599'] },
    { id: 'part', cells: ['Drain pipe (1 m, ISI)', '1', '₹120'] },
    { id: 'coil', cells: ['Anti-corrosion coil spray', '1', '₹180'] },
    { id: 'visit', cells: ['Visiting charge', '1', '₹0 (waived)'] },
    { id: 'discount', cells: ['First booking discount', '—', '−₹60'] },
    { id: 'gst', cells: ['GST (18%, included)', '—', '₹128'] },
    { id: 'total', cells: ['Total paid', '', '₹839'] },
  ],
} as const;

/** `₹1,200` — for row descriptions, which are plain text. */
export const rupees = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

/** The category a quick fix or a service id belongs to. */
export function categoryOf(key: string): Category {
  const found = CATEGORIES.find((c) => c.key === key);
  if (!found) {
    throw new Error(`Unknown home-services category ${key}`);
  }
  return found;
}

/** The variables picking a service stores for the rest of a flow. */
export function serviceVars(category: Category, service: Service): Record<string, string> {
  return {
    category: category.name,
    categoryKey: category.key,
    service: service.title,
    servicePrice: String(service.price),
    serviceMrp: String(service.mrp),
    duration: service.duration,
    warranty: service.warranty,
    techName: category.technician.name,
    techPhone: category.technician.phone,
    techRating: category.technician.rating,
    techJobs: String(category.technician.jobs),
    techYears: String(category.technician.years),
  };
}

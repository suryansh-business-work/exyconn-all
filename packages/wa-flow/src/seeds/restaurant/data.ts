/**
 * The Saffron Table's dummy data: the restaurant, party sizes, seating areas, occasions,
 * pre-order platters and drinks, chef's specials and the printed menu.
 * Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const RESTAURANT = {
  name: 'The Saffron Table, Hauz Khas Village',
  phone: '+91 11 4155 2200',
  address: '32 Hauz Khas Village, near Deer Park gate, New Delhi 110016',
  lat: 28.5535,
  lng: 77.194,
  website: 'https://saffrontable.example',
  directions: 'https://maps.saffrontable.example/hkv',
  review: 'https://reviews.saffrontable.example/hkv',
} as const;

export const HOST = {
  agentName: 'Kunal (Saffron Table host)',
  name: 'Kunal Arora',
  phone: '+91 98110 22004',
  role: 'Floor manager, Hauz Khas Village',
} as const;

export const EVENTS_DESK = {
  agentName: 'Sana (Events and private dining)',
  phone: '+91 98110 22010',
} as const;

/** Deposit per large-party booking, adjusted against the bill. */
export const LARGE_PARTY = { from: 7, deposit: 2000 } as const;

export interface PartySize {
  id: string;
  title: string;
  /** Shown back to the guest, e.g. "4" or "7–8". */
  label: string;
  /** Compared against LARGE_PARTY.from. */
  size: number;
}

export const PARTY_SIZES: readonly PartySize[] = [
  { id: 'p1', title: '1 guest', label: '1', size: 1 },
  { id: 'p2', title: '2 guests', label: '2', size: 2 },
  { id: 'p3', title: '3 guests', label: '3', size: 3 },
  { id: 'p4', title: '4 guests', label: '4', size: 4 },
  { id: 'p5', title: '5 guests', label: '5', size: 5 },
  { id: 'p6', title: '6 guests', label: '6', size: 6 },
  { id: 'p8', title: '7–8 guests', label: '7–8', size: 8 },
  { id: 'p12', title: '9–12 guests', label: '9–12', size: 12 },
];

export const SEATING = [
  { id: 'indoor', title: 'Indoor dining', description: 'Air-conditioned, lake-view windows' },
  {
    id: 'rooftop',
    title: 'Rooftop terrace',
    description: 'Open air, fairy lights · weather permitting',
  },
  { id: 'booth', title: 'Private booth', description: 'Curtained booth for 4–6 guests' },
  { id: 'bar', title: 'Bar counter', description: 'Mocktail bar, best for 1–2 guests' },
] as const;

export const OCCASIONS = [
  { id: 'birthday', title: 'Birthday', special: 'yes' },
  { id: 'anniversary', title: 'Anniversary', special: 'yes' },
  { id: 'date', title: 'Date night', special: 'no' },
  { id: 'business', title: 'Business meal', special: 'no' },
  { id: 'none', title: 'Just dining', special: 'no' },
] as const;

export interface Dish {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  mrp?: number;
  badge?: string;
  icon: IconKey;
  accent: 'orange' | 'green' | 'red' | 'amber' | 'brown';
}

/** Pre-order platters — each one serves the table, so there is no quantity to pick. */
export const PLATTERS: readonly Dish[] = [
  {
    id: 'mezze-veg',
    title: 'Veg Mezze Feast (2)',
    subtitle: 'Paneer tikka, hara bhara kebab, dahi ke kebab, chutneys',
    price: 1450,
    mrp: 1690,
    badge: 'Veg',
    icon: 'food',
    accent: 'green',
  },
  {
    id: 'tandoor',
    title: 'Tandoori Platter (2)',
    subtitle: 'Murgh malai tikka, seekh kebab, fish tikka, naan basket',
    price: 1850,
    mrp: 2150,
    badge: 'Bestseller',
    icon: 'food',
    accent: 'red',
  },
  {
    id: 'thali',
    title: 'Royal Thali × 2',
    subtitle: 'Dal makhani, paneer lababdar, 2 sabzis, rice, rotis, dessert',
    price: 1290,
    badge: 'Veg',
    icon: 'restaurant',
    accent: 'amber',
  },
  {
    id: 'biryani',
    title: 'Biryani Feast (4)',
    subtitle: 'Dum biryani handi, raita, mirchi ka salan, kebabs',
    price: 2890,
    mrp: 3400,
    badge: 'Serves 4',
    icon: 'food',
    accent: 'orange',
  },
  {
    id: 'tasting',
    title: "Chef's Tasting (2)",
    subtitle: 'Seven courses from Chef Rohit, paired with mocktails',
    price: 3200,
    badge: 'Chef special',
    icon: 'star',
    accent: 'brown',
  },
  {
    id: 'kids',
    title: 'Kids Combo',
    subtitle: 'Mini butter chicken or paneer, rice, fries and a shake',
    price: 450,
    icon: 'child',
    accent: 'amber',
  },
];

export const DRINKS = [
  { id: 'lassi', title: 'Mango lassi jug', description: 'Serves 4', price: 480 },
  { id: 'chaas', title: 'Masala chaas jug', description: 'Serves 4', price: 350 },
  { id: 'mojito', title: 'Virgin mojito pitcher', description: 'Serves 4', price: 650 },
  { id: 'kokum', title: 'Kokum cooler jug', description: 'Serves 4', price: 420 },
  { id: 'nimbu', title: 'Fresh lime soda × 4', description: 'Sweet, salted or mixed', price: 360 },
] as const;

/** The chef's specials carousel on the menu journey. */
export const SPECIALS: readonly Dish[] = [
  {
    id: 'galouti',
    title: 'Galouti kebab',
    subtitle: 'Melt-in-the-mouth Lucknowi lamb, on ulte tawe ka paratha',
    price: 695,
    badge: 'Signature',
    icon: 'food',
    accent: 'brown',
  },
  {
    id: 'dal',
    title: 'Dal Saffron',
    subtitle: 'Black dal slow-cooked for 18 hours, white butter',
    price: 445,
    badge: 'Veg',
    icon: 'food',
    accent: 'amber',
  },
  {
    id: 'butter-chicken',
    title: 'Old Delhi butter chicken',
    subtitle: 'Tandoor-smoked chicken in tomato-butter gravy',
    price: 625,
    badge: 'Bestseller',
    icon: 'food',
    accent: 'red',
  },
  {
    id: 'kulfi',
    title: 'Rabri kulfi falooda',
    subtitle: 'Kesar-pista kulfi, rabri and rose falooda',
    price: 325,
    icon: 'food',
    accent: 'orange',
  },
];

/** The printed menu, as table rows: [dish, description, price]. */
export const MENU_PDF = {
  starters: [
    ['Paneer tikka', 'Charred cottage cheese, mint chutney', '₹445'],
    ['Hara bhara kebab', 'Spinach and green pea patties', '₹365'],
    ['Murgh malai tikka', 'Creamy chicken, cardamom', '₹525'],
    ['Amritsari fish', 'Gram-flour batter, ajwain', '₹595'],
    ['Galouti kebab', 'Lucknowi lamb, ulte tawe ka paratha', '₹695'],
  ],
  mains: [
    ['Dal Saffron', 'Black dal, 18 hours, white butter', '₹445'],
    ['Paneer lababdar', 'Tomato-onion gravy, kasuri methi', '₹495'],
    ['Old Delhi butter chicken', 'Tandoor-smoked, tomato-butter gravy', '₹625'],
    ['Laal maas', 'Rajasthani mutton, mathania chilli', '₹745'],
    ['Subz dum biryani', 'Seasonal vegetables, saffron, mint', '₹475'],
    ['Gosht dum biryani', 'Mutton, saffron, fried onion', '₹695'],
  ],
  desserts: [
    ['Rabri kulfi falooda', 'Kesar-pista, rose falooda', '₹325'],
    ['Gulab jamun', 'Two pieces, warm, with rabri', '₹245'],
    ['Shahi tukda', 'Saffron bread pudding, nuts', '₹295'],
  ],
} as const;

export const toRows = (rows: readonly (readonly string[])[], prefix: string) =>
  rows.map((cells, index) => ({ id: `${prefix}-${index + 1}`, cells: [...cells] }));

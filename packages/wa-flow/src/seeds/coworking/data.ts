/**
 * Loftline Workspaces' dummy catalogue: centres in five cities, meeting rooms with hourly
 * rates (totals and GST worked out per duration), day passes, membership plans and the team
 * leads are handed to. Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export { rupees } from '../healthcare/data';

export const BRAND = {
  phone: '+91 80 4000 5500',
  address: '4th Floor, Maple Square, 80 Feet Road, Koramangala 4th Block, Bengaluru 560034',
  website: 'https://loftline.example',
  tour3d: 'https://loftline.example/virtual-tour',
  rules: 'https://loftline.example/house-rules',
} as const;

export const COMMUNITY = {
  agentName: 'Ritika (Community Manager)',
  name: 'Ritika Sharma',
  role: 'Community Manager',
  phone: '+91 80 4000 5511',
} as const;

export const SALES = {
  agentName: 'Nikhil Rao (Memberships)',
  name: 'Nikhil Rao',
  role: 'Membership Manager',
  phone: '+91 80 4000 5520',
} as const;

export interface Centre {
  id: string;
  name: string;
  city: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  /** Day pass price in rupees, before 18% GST. */
  dayPass: number;
  highlights: string;
}

export const CENTRES: readonly Centre[] = [
  {
    id: 'koramangala',
    name: 'Loftline Koramangala',
    city: 'Bengaluru',
    area: 'Koramangala 4th Block',
    address: BRAND.address,
    lat: 12.9352,
    lng: 77.6245,
    dayPass: 599,
    highlights: '320 seats · rooftop café · 24×7 access',
  },
  {
    id: 'whitefield',
    name: 'Loftline Whitefield',
    city: 'Bengaluru',
    area: 'ITPL Main Road',
    address: '2nd Floor, Orion Arcade, ITPL Main Road, Whitefield, Bengaluru 560066',
    lat: 12.9698,
    lng: 77.75,
    dayPass: 499,
    highlights: '260 seats · metro 5 min · podcast room',
  },
  {
    id: 'baner',
    name: 'Loftline Baner',
    city: 'Pune',
    area: 'Baner–Balewadi',
    address: '5th Floor, Kalpataru Square, Baner Road, Pune 411045',
    lat: 18.559,
    lng: 73.7868,
    dayPass: 449,
    highlights: '210 seats · terrace garden · phone booths',
  },
  {
    id: 'cyber-city',
    name: 'Loftline Cyber City',
    city: 'Gurugram',
    area: 'DLF Cyber City',
    address: 'Tower B, 9th Floor, Cyber Greens, DLF Phase 2, Gurugram 122002',
    lat: 28.4949,
    lng: 77.0895,
    dayPass: 649,
    highlights: '400 seats · rapid metro · event hall',
  },
  {
    id: 'madhapur',
    name: 'Loftline Madhapur',
    city: 'Hyderabad',
    area: 'Hitech City Road',
    address: '3rd Floor, Skyview Commons, Hitech City Road, Madhapur, Hyderabad 500081',
    lat: 17.4483,
    lng: 78.3915,
    dayPass: 499,
    highlights: '280 seats · gym · 24×7 access',
  },
];

export const CITIES = ['Bengaluru', 'Pune', 'Gurugram', 'Hyderabad'] as const;

/** 18% GST, rounded to the rupee. */
export const gst = (amount: number): number => Math.round(amount * 0.18);

/** Centres as list sections, one per city — used by every flow that starts with a centre. */
export function centreSections(extra: (centre: Centre) => Record<string, string> = () => ({})) {
  return CITIES.map((city) => ({
    id: city.toLowerCase(),
    title: city,
    rows: CENTRES.filter((c) => c.city === city).map((c) => ({
      id: c.id,
      title: c.name.replace('Loftline ', ''),
      description: `${c.area} · ${c.highlights}`,
      set: {
        centre: c.name,
        centreId: c.id,
        area: c.area,
        highlights: c.highlights,
        ...extra(c),
      },
    })),
  }));
}

export interface Room {
  id: string;
  name: string;
  seats: number;
  /** Rupees per hour, before GST. */
  rate: number;
  kit: string;
  icon: IconKey;
}

export const ROOMS: readonly Room[] = [
  {
    id: 'huddle',
    name: 'Huddle room',
    seats: 4,
    rate: 400,
    kit: '43" screen, whiteboard',
    icon: 'chat',
  },
  {
    id: 'boardroom',
    name: 'Boardroom',
    seats: 8,
    rate: 900,
    kit: '65" screen, video bar, whiteboard',
    icon: 'business',
  },
  {
    id: 'conference',
    name: 'Conference room',
    seats: 14,
    rate: 1500,
    kit: 'Dual screens, ceiling mics, video bar',
    icon: 'group',
  },
  {
    id: 'training',
    name: 'Training room',
    seats: 30,
    rate: 3000,
    kit: 'Projector, mics, classroom seating',
    icon: 'school',
  },
];

/** Durations a meeting room can be booked for — one carousel each, with totals worked out. */
export const DURATIONS = [
  { id: '1', hours: 1, title: '1 hour' },
  { id: '2', hours: 2, title: '2 hours' },
  { id: '4', hours: 4, title: 'Half day (4 hrs)' },
] as const;

export interface Plan {
  id: string;
  name: string;
  detail: string;
  /** Monthly price per seat in rupees, before GST. */
  price: number;
  mrp?: number;
  badge?: string;
  icon: IconKey;
}

export const PLANS: readonly Plan[] = [
  {
    id: 'hot-desk',
    name: 'Hot desk',
    detail: 'Any open seat, 9 am – 9 pm, 4 room hours a month',
    price: 7999,
    mrp: 8999,
    icon: 'coffee',
  },
  {
    id: 'dedicated',
    name: 'Dedicated desk',
    detail: 'Your own desk and locker, 24×7, 8 room hours',
    price: 11999,
    badge: 'Most popular',
    icon: 'laptop',
  },
  {
    id: 'cabin',
    name: 'Private cabin',
    detail: 'Lockable cabin for 4–12, branding, 20 room hours',
    price: 13499,
    badge: 'Per seat',
    icon: 'key',
  },
  {
    id: 'virtual',
    name: 'Virtual office',
    detail: 'Business address, GST registration, mail handling',
    price: 2499,
    mrp: 2999,
    icon: 'mail',
  },
];

/** Day-pass add-ons, prices include GST. */
export const ADDONS = [
  { id: 'lunch', title: 'Add lunch', label: 'Lunch buffet', price: 220 },
  { id: 'parking', title: 'Add car parking', label: 'Car parking', price: 150 },
  { id: 'none', title: 'No add-ons', label: 'No add-ons', price: 0 },
] as const;

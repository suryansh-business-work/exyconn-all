/**
 * Lumio Home's dummy product catalogue, by category. Fictional products and prices.
 */
import type { IconKey } from '../../visuals';

export interface Item {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  mrp: number;
  badge?: string;
  rating: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: IconKey;
  items: readonly Item[];
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'security',
    name: 'Home security',
    description: 'Cameras, doorbells and smart locks',
    icon: 'lock',
    items: [
      {
        id: 'cam-2k',
        title: 'Lumio Cam 2K',
        subtitle: '2K indoor camera · night vision · two-way talk',
        price: 2999,
        mrp: 4499,
        badge: 'Bestseller',
        rating: '4.6 ★ (8,214)',
      },
      {
        id: 'doorbell',
        title: 'Lumio Video Doorbell',
        subtitle: 'HD video · visitor alerts on your phone · chime',
        price: 6499,
        mrp: 8999,
        rating: '4.5 ★ (3,102)',
      },
      {
        id: 'lock-pro',
        title: 'Lumio Smart Lock Pro',
        subtitle: 'Fingerprint, PIN, app and key · auto-lock',
        price: 12999,
        mrp: 17999,
        badge: 'New',
        rating: '4.7 ★ (1,276)',
      },
    ],
  },
  {
    id: 'lighting',
    name: 'Smart lighting',
    description: 'Bulbs, strips and panels you control by voice',
    icon: 'electricity',
    items: [
      {
        id: 'bulb-4',
        title: 'Lumio Smart Bulb (4-pack)',
        subtitle: '16 million colours · voice control · 9 W',
        price: 2499,
        mrp: 3596,
        badge: 'Value pack',
        rating: '4.4 ★ (12,540)',
      },
      {
        id: 'strip-5m',
        title: 'Lumio Light Strip 5 m',
        subtitle: 'Music sync · cut-to-fit · app scenes',
        price: 1999,
        mrp: 2999,
        rating: '4.3 ★ (6,081)',
      },
      {
        id: 'panel',
        title: 'Lumio Ceiling Panel',
        subtitle: 'Tunable white · circadian mode · 36 W',
        price: 5499,
        mrp: 7999,
        rating: '4.6 ★ (942)',
      },
    ],
  },
  {
    id: 'audio',
    name: 'Audio & TV',
    description: 'Earbuds, speakers and soundbars',
    icon: 'music',
    items: [
      {
        id: 'buds',
        title: 'Lumio Buds ANC',
        subtitle: 'Active noise cancelling · 40 h battery',
        price: 3999,
        mrp: 6999,
        badge: 'Top rated',
        rating: '4.5 ★ (9,830)',
      },
      {
        id: 'soundbar',
        title: 'Lumio Soundbar 2.1',
        subtitle: '160 W · wireless subwoofer · Dolby Audio',
        price: 11999,
        mrp: 16999,
        rating: '4.6 ★ (2,415)',
      },
      {
        id: 'mini',
        title: 'Lumio Speaker Mini',
        subtitle: 'Smart speaker · built-in assistant',
        price: 2499,
        mrp: 3999,
        rating: '4.3 ★ (4,407)',
      },
    ],
  },
  {
    id: 'climate',
    name: 'Air & energy',
    description: 'Purifiers, smart plugs and sensors',
    icon: 'home',
    items: [
      {
        id: 'purifier',
        title: 'Lumio Air Purifier 300',
        subtitle: 'HEPA H13 · rooms up to 400 sq ft · AQI display',
        price: 9999,
        mrp: 13999,
        badge: 'Winter pick',
        rating: '4.5 ★ (2,980)',
      },
      {
        id: 'plug-2',
        title: 'Lumio Smart Plug (2-pack)',
        subtitle: 'Energy monitoring · schedules · 16 A',
        price: 1299,
        mrp: 1999,
        rating: '4.4 ★ (7,655)',
      },
      {
        id: 'sensors',
        title: 'Lumio Sensor Kit',
        subtitle: 'Door, motion and leak sensors with hub',
        price: 3499,
        mrp: 4999,
        rating: '4.4 ★ (1,118)',
      },
    ],
  },
];

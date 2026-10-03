/**
 * Glow & Co.'s dummy catalogue: the salon itself, its stylists, service menus by category
 * (each with a deposit and a matching add-on to upsell), packages and memberships.
 * Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const SALON = {
  name: 'Glow & Co. Salon and Spa, Bandra West',
  phone: '+91 22 4890 5500',
  address: '14 Hill Road, opposite Elco Market, Bandra West, Mumbai 400050',
  lat: 19.0544,
  lng: 72.8336,
  website: 'https://glowandco.example',
  directions: 'https://maps.glowandco.example/bandra',
  review: 'https://reviews.glowandco.example/bandra',
  lookbook: 'https://glowandco.example/lookbook',
} as const;

/** The front desk every escalation is handed to. */
export const FRONT_DESK = {
  agentName: 'Riya (Glow & Co. front desk)',
  name: 'Riya Nair',
  phone: '+91 98200 41155',
  role: 'Guest relations, Bandra West',
} as const;

/** The bridal consultant custom packages go to. */
export const BRIDAL_DESK = {
  agentName: 'Meher Kapoor (Bridal studio)',
  phone: '+91 98200 41177',
} as const;

export interface Stylist {
  id: string;
  name: string;
  speciality: string;
  years: number;
  /** Extra charged for this stylist, in rupees. */
  premium: number;
}

export const STYLISTS: readonly Stylist[] = [
  {
    id: 'meher',
    name: 'Meher Kapoor',
    speciality: 'Creative director · bridal',
    years: 14,
    premium: 500,
  },
  {
    id: 'aarav',
    name: 'Aarav Shah',
    speciality: 'Senior stylist · colour expert',
    years: 9,
    premium: 300,
  },
  {
    id: 'zoya',
    name: 'Zoya Fernandes',
    speciality: 'Senior therapist · skin and spa',
    years: 11,
    premium: 300,
  },
  {
    id: 'kabir',
    name: 'Kabir Malhotra',
    speciality: "Stylist · men's grooming",
    years: 6,
    premium: 0,
  },
  {
    id: 'tanya',
    name: "Tanya D'Souza",
    speciality: 'Nail artist · gel and extensions',
    years: 5,
    premium: 0,
  },
  {
    id: 'imran',
    name: 'Imran Qureshi',
    speciality: 'Stylist · cuts and blow-dries',
    years: 7,
    premium: 0,
  },
];

export interface Service {
  id: string;
  name: string;
  description: string;
  /** Rupees. */
  price: number;
  durationMin: number;
}

export interface ServiceCategory {
  key: string;
  name: string;
  description: string;
  icon: IconKey;
  /** Taken now, adjusted in the final bill. */
  deposit: number;
  /** The add-on offered after the slot is picked. */
  upsell: { name: string; price: number; mrp: number };
  services: readonly Service[];
}

export const CATEGORIES: readonly ServiceCategory[] = [
  {
    key: 'hair',
    name: 'Hair',
    description: 'Cuts, blow-dries, colour, keratin and hair spa',
    icon: 'beauty',
    deposit: 300,
    upsell: { name: 'Olaplex bond repair', price: 900, mrp: 1500 },
    services: [
      {
        id: 'cut-women',
        name: 'Haircut and style',
        description: 'Wash, cut and blow-dry',
        price: 1200,
        durationMin: 60,
      },
      {
        id: 'cut-men',
        name: "Men's haircut",
        description: 'Consultation, cut and styling',
        price: 550,
        durationMin: 30,
      },
      {
        id: 'blow-dry',
        name: 'Blow-dry',
        description: 'Straight, curls or waves',
        price: 700,
        durationMin: 30,
      },
      {
        id: 'global-colour',
        name: 'Global colour',
        description: 'Ammonia-free, root to tip',
        price: 3800,
        durationMin: 120,
      },
      {
        id: 'highlights',
        name: 'Balayage highlights',
        description: 'Hand-painted, with toner',
        price: 5500,
        durationMin: 150,
      },
      {
        id: 'keratin',
        name: 'Keratin treatment',
        description: 'Smooth, frizz-free for 4 months',
        price: 6900,
        durationMin: 180,
      },
      {
        id: 'hair-spa',
        name: 'Hair spa',
        description: 'Deep conditioning and scalp massage',
        price: 1800,
        durationMin: 60,
      },
    ],
  },
  {
    key: 'skin',
    name: 'Skin and facials',
    description: 'Facials, clean-ups, de-tan and peels',
    icon: 'spa',
    deposit: 300,
    upsell: { name: 'Under-eye treatment', price: 600, mrp: 900 },
    services: [
      {
        id: 'cleanup',
        name: 'Express clean-up',
        description: 'Cleanse, scrub and mask',
        price: 900,
        durationMin: 40,
      },
      {
        id: 'classic-facial',
        name: 'Classic facial',
        description: 'For all skin types',
        price: 1600,
        durationMin: 60,
      },
      {
        id: 'hydra-facial',
        name: 'HydraFacial',
        description: 'Deep cleanse and hydration, no downtime',
        price: 4200,
        durationMin: 75,
      },
      {
        id: 'de-tan',
        name: 'De-tan pack',
        description: 'Face and neck, brightening',
        price: 950,
        durationMin: 40,
      },
      {
        id: 'glow-peel',
        name: 'Glow peel',
        description: 'Gentle fruit-acid peel',
        price: 2800,
        durationMin: 50,
      },
    ],
  },
  {
    key: 'nails',
    name: 'Nails',
    description: 'Manicures, pedicures, gel and nail art',
    icon: 'beauty',
    deposit: 200,
    upsell: { name: 'Paraffin hand wax', price: 450, mrp: 700 },
    services: [
      {
        id: 'manicure',
        name: 'Classic manicure',
        description: 'Shape, cuticle care and polish',
        price: 750,
        durationMin: 40,
      },
      {
        id: 'pedicure',
        name: 'Spa pedicure',
        description: 'Soak, scrub, massage and polish',
        price: 1100,
        durationMin: 50,
      },
      {
        id: 'gel-polish',
        name: 'Gel polish',
        description: 'Chip-free shine for 3 weeks',
        price: 1300,
        durationMin: 45,
      },
      {
        id: 'nail-art',
        name: 'Nail art',
        description: 'Designs from our lookbook',
        price: 1600,
        durationMin: 60,
      },
      {
        id: 'extensions',
        name: 'Gel extensions',
        description: 'Full set, any length',
        price: 2800,
        durationMin: 90,
      },
    ],
  },
  {
    key: 'spa',
    name: 'Spa and massage',
    description: 'Swedish, deep tissue, Balinese and couple spa',
    icon: 'spa',
    deposit: 500,
    upsell: { name: 'Aroma foot ritual', price: 700, mrp: 1100 },
    services: [
      {
        id: 'swedish',
        name: 'Swedish massage',
        description: '60 min · relaxing, light pressure',
        price: 2900,
        durationMin: 60,
      },
      {
        id: 'deep-tissue',
        name: 'Deep tissue massage',
        description: '60 min · for knots and stiffness',
        price: 3300,
        durationMin: 60,
      },
      {
        id: 'balinese',
        name: 'Balinese massage',
        description: '90 min · stretches and acupressure',
        price: 3900,
        durationMin: 90,
      },
      {
        id: 'head-neck',
        name: 'Head, neck and shoulder',
        description: '30 min · desk-day reset',
        price: 1200,
        durationMin: 30,
      },
      {
        id: 'couple-spa',
        name: 'Couple spa',
        description: '90 min · side by side, with steam',
        price: 6800,
        durationMin: 90,
      },
    ],
  },
  {
    key: 'grooming',
    name: "Men's grooming",
    description: 'Beard, shave, facials and colour for men',
    icon: 'person',
    deposit: 200,
    upsell: { name: 'Charcoal face mask', price: 350, mrp: 600 },
    services: [
      {
        id: 'beard',
        name: 'Beard trim and shape',
        description: 'Hot towel and line-up',
        price: 400,
        durationMin: 20,
      },
      {
        id: 'shave',
        name: 'Classic shave',
        description: 'Hot towel, straight razor',
        price: 350,
        durationMin: 25,
      },
      {
        id: 'men-facial',
        name: "Men's facial",
        description: 'Deep cleanse for oily skin',
        price: 1300,
        durationMin: 45,
      },
      {
        id: 'men-colour',
        name: 'Hair and beard colour',
        description: 'Natural shades, covers grey',
        price: 1500,
        durationMin: 45,
      },
    ],
  },
];

export interface SalonPackage {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  mrp: number;
  badge?: string;
  icon: IconKey;
  /** What the package card and invoice call its validity. */
  validity: string;
  sessions: string;
}

export const PACKAGES: readonly SalonPackage[] = [
  {
    id: 'glow-card',
    title: 'Glow Card',
    subtitle: '20% off every service for a year · free birthday blow-dry',
    price: 1999,
    mrp: 2999,
    badge: 'Most popular',
    icon: 'card',
    validity: '12 months',
    sessions: 'Unlimited visits',
  },
  {
    id: 'grooming-club',
    title: 'Monthly Grooming Club',
    subtitle: '1 haircut + 1 beard trim + 1 clean-up every month',
    price: 1499,
    mrp: 2050,
    icon: 'person',
    validity: '1 month, renews',
    sessions: '3 services a month',
  },
  {
    id: 'hair-spa-4',
    title: 'Hair Spa × 4',
    subtitle: 'Four deep-conditioning sessions, share with family',
    price: 5499,
    mrp: 7200,
    badge: 'Save 24%',
    icon: 'beauty',
    validity: '6 months',
    sessions: '4 sessions',
  },
  {
    id: 'spa-day',
    title: 'Spa Day for Two',
    subtitle: '90-min couple massage, steam, foot ritual and mocktails',
    price: 7999,
    mrp: 10500,
    icon: 'spa',
    validity: '3 months',
    sessions: '1 visit for 2',
  },
  {
    id: 'bridal-glow',
    title: 'Bridal Glow',
    subtitle: '3 facials, hair spa, mani-pedi and a trial look',
    price: 14999,
    mrp: 19500,
    badge: 'Wedding season',
    icon: 'gift',
    validity: '4 months',
    sessions: '7 sittings',
  },
];

/** Starting prices for the "how much" answer, one row per category. */
export const PRICE_GUIDE = CATEGORIES.map((c) => ({
  id: c.key,
  name: c.name,
  from: Math.min(...c.services.map((s) => s.price)),
}));

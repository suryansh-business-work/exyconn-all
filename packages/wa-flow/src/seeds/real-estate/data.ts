/**
 * Skyline Realty's dummy data: the office, relationship managers, homes for sale by budget
 * band, homes to rent, localities, and home-loan EMIs (worked out here, because a template
 * cannot multiply). Fictional projects, RERA numbers, phones and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const OFFICE = {
  name: 'Skyline Realty Experience Centre',
  phone: '+91 40 4567 8800',
  address: 'Plot 12, Financial District Road, Nanakramguda, Gachibowli, Hyderabad 500032',
  lat: 17.4239,
  lng: 78.3463,
  website: 'https://skylinerealty.example',
  tour: 'https://skylinerealty.example/virtual-tour',
} as const;

export const RM = {
  agentName: 'Karthik Reddy (Relationship manager)',
  name: 'Karthik Reddy',
  phone: '+91 98490 31200',
  role: 'Senior relationship manager, West Hyderabad',
} as const;

export const LOAN_DESK = {
  agentName: 'Divya (Home loans)',
  name: 'Divya Menon',
  phone: '+91 98490 31244',
  role: 'Home-loan advisor',
} as const;

export interface Listing {
  id: string;
  title: string;
  area: string;
  config: string;
  sqft: number;
  /** Rupees — the sale price, or the monthly rent. */
  price: number;
  /** Short Indian price, e.g. "₹68 L" or "₹1.32 Cr". */
  priceLabel: string;
  possession: string;
  rera: string;
  badge?: string;
  icon: IconKey;
}

export interface Band {
  id: string;
  title: string;
  description: string;
  listings: readonly Listing[];
}

export const BUY_BANDS: readonly Band[] = [
  {
    id: 'under-80',
    title: 'Under ₹80 lakh',
    description: '2 BHK apartments in growing suburbs',
    listings: [
      {
        id: 'lakeview',
        title: 'Lakeview Residency',
        area: 'Tellapur',
        config: '2 BHK',
        sqft: 1180,
        price: 6800000,
        priceLabel: '₹68 L',
        possession: 'Ready to move',
        rera: 'P02400004321',
        badge: 'Ready to move',
        icon: 'realestate',
      },
      {
        id: 'meadows',
        title: 'Green Meadows',
        area: 'Kollur',
        config: '2 BHK',
        sqft: 1065,
        price: 5900000,
        priceLabel: '₹59 L',
        possession: 'June 2027',
        rera: 'P02400005107',
        badge: 'Lowest price',
        icon: 'plant',
      },
      {
        id: 'sunrise',
        title: 'Sunrise Heights',
        area: 'Bachupally',
        config: '2 BHK',
        sqft: 1240,
        price: 7200000,
        priceLabel: '₹72 L',
        possession: 'Dec 2026',
        rera: 'P02200003988',
        icon: 'realestate',
      },
    ],
  },
  {
    id: 'mid',
    title: '₹80 lakh – ₹1.5 crore',
    description: '2.5 and 3 BHK in gated communities',
    listings: [
      {
        id: 'aurum',
        title: 'Aurum Towers',
        area: 'Gachibowli',
        config: '2.5 BHK',
        sqft: 1420,
        price: 9600000,
        priceLabel: '₹96 L',
        possession: 'Ready to move',
        rera: 'P02400002765',
        badge: 'Walk to work',
        icon: 'realestate',
      },
      {
        id: 'crest',
        title: 'Skyline Crest',
        area: 'Kondapur',
        config: '3 BHK',
        sqft: 1865,
        price: 13200000,
        priceLabel: '₹1.32 Cr',
        possession: 'March 2027',
        rera: 'P02400006011',
        badge: 'Bestseller',
        icon: 'realestate',
      },
      {
        id: 'palm',
        title: 'Palm Grove',
        area: 'Narsingi',
        config: '3 BHK',
        sqft: 1720,
        price: 11800000,
        priceLabel: '₹1.18 Cr',
        possession: 'Sept 2027',
        rera: 'P02400005560',
        icon: 'plant',
      },
    ],
  },
  {
    id: 'premium',
    title: 'Above ₹1.5 crore',
    description: '4 BHK sky homes, villas and penthouses',
    listings: [
      {
        id: 'summit',
        title: 'The Summit',
        area: 'Kokapet',
        config: '4 BHK',
        sqft: 3150,
        price: 28500000,
        priceLabel: '₹2.85 Cr',
        possession: 'Dec 2027',
        rera: 'P02400007204',
        badge: 'Lake view',
        icon: 'realestate',
      },
      {
        id: 'riverbend',
        title: 'Riverbend Villas',
        area: 'Tellapur',
        config: '4 BHK villa',
        sqft: 4200,
        price: 34000000,
        priceLabel: '₹3.4 Cr',
        possession: 'Ready to move',
        rera: 'P02400003390',
        badge: 'Private garden',
        icon: 'home',
      },
      {
        id: 'orchid',
        title: 'Orchid Sky Penthouse',
        area: 'Financial District',
        config: '4 BHK duplex',
        sqft: 4650,
        price: 41000000,
        priceLabel: '₹4.1 Cr',
        possession: 'June 2028',
        rera: 'P02400008125',
        badge: 'Only 6 left',
        icon: 'key',
      },
    ],
  },
];

export const RENTALS: readonly Listing[] = [
  {
    id: 'rent-aurum',
    title: 'Aurum Towers',
    area: 'Gachibowli',
    config: '2 BHK · furnished',
    sqft: 1250,
    price: 42000,
    priceLabel: '₹42,000/month',
    possession: 'Available now',
    rera: '—',
    badge: 'Furnished',
    icon: 'realestate',
  },
  {
    id: 'rent-crest',
    title: 'Skyline Crest',
    area: 'Kondapur',
    config: '3 BHK · semi-furnished',
    sqft: 1865,
    price: 58000,
    priceLabel: '₹58,000/month',
    possession: 'From the 1st',
    rera: '—',
    icon: 'realestate',
  },
  {
    id: 'rent-palm',
    title: 'Palm Grove',
    area: 'Narsingi',
    config: '2 BHK · unfurnished',
    sqft: 1150,
    price: 32000,
    priceLabel: '₹32,000/month',
    possession: 'Available now',
    rera: '—',
    badge: 'Pet friendly',
    icon: 'pet',
  },
  {
    id: 'rent-studio',
    title: 'Hitech Studio Suites',
    area: 'Hitech City',
    config: 'Studio · furnished',
    sqft: 520,
    price: 22000,
    priceLabel: '₹22,000/month',
    possession: 'Available now',
    rera: '—',
    icon: 'key',
  },
];

export const ALL_FOR_SALE: readonly Listing[] = BUY_BANDS.flatMap((b) => b.listings);

export const LOCALITIES = [
  { id: 'gachibowli', title: 'Gachibowli' },
  { id: 'kondapur', title: 'Kondapur' },
  { id: 'kokapet', title: 'Kokapet' },
  { id: 'narsingi', title: 'Narsingi' },
  { id: 'tellapur', title: 'Tellapur' },
  { id: 'fd', title: 'Financial District' },
  { id: 'any', title: 'Anywhere in the west' },
] as const;

/** What choosing a listing stores for the rest of the chat. */
export const listingSet = (listing: Listing) => ({
  listing: listing.title,
  listingArea: listing.area,
  listingConfig: listing.config,
  listingPrice: listing.priceLabel,
  sqft: String(listing.sqft),
  possession: listing.possession,
  rera: listing.rera,
});

export const LOAN_AMOUNTS = [
  { id: 'l50', title: '₹50 lakh', amount: 5000000 },
  { id: 'l75', title: '₹75 lakh', amount: 7500000 },
  { id: 'l100', title: '₹1 crore', amount: 10000000 },
  { id: 'l150', title: '₹1.5 crore', amount: 15000000 },
  { id: 'l200', title: '₹2 crore', amount: 20000000 },
] as const;

export const TENURES = [15, 20, 25] as const;
/** Indicative floating rate, per year. */
export const LOAN_RATE = 8.5;

/** Monthly EMI, rounded to the rupee. */
export function emi(principal: number, years: number): number {
  const monthly = LOAN_RATE / 12 / 100;
  const months = years * 12;
  const factor = (1 + monthly) ** months;
  return Math.round((principal * monthly * factor) / (factor - 1));
}

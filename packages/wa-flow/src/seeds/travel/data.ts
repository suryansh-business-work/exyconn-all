/**
 * TrailNest Holidays' dummy catalogue: the agency itself, its travel experts, holiday packages
 * by category, budget bands, quote tiers and a sample booked itinerary. Fictional names,
 * numbers and `.example` links.
 */
import type { AccentKey, IconKey } from '../../visuals';

export const AGENCY = {
  name: 'TrailNest Holidays, Andheri',
  phone: '+91 22 4890 5500',
  helpline: '+91 22 4890 5599',
  address: 'Office 402, Sterling Business Park, Andheri-Kurla Road, Andheri East, Mumbai 400059',
  lat: 19.1136,
  lng: 72.8697,
  website: 'https://trailnest.example',
  videoCall: 'https://meet.trailnest.example/consult',
  checkIn: 'https://trailnest.example/web-check-in',
  visa: 'https://trailnest.example/visa',
} as const;

/** The trip desk every live chat is handed to. */
export const TRIP_DESK = {
  agentName: 'Sana Sheikh (Trip desk)',
  name: 'Sana Sheikh',
  phone: '+91 22 4890 5510',
  role: 'Senior travel consultant',
} as const;

/** The tour manager who travels with the sample itinerary's group. */
export const TOUR_MANAGER = {
  name: 'Joseph Mathew',
  phone: '+91 98470 22314',
  role: 'Tour manager, Kerala',
  organisation: 'TrailNest Holidays',
} as const;

export interface Consultant {
  id: string;
  name: string;
  focus: string;
  years: number;
  languages: string;
}

export const CONSULTANTS: readonly Consultant[] = [
  {
    id: 'meera',
    name: 'Meera Kapoor',
    focus: 'Europe, UK and Scandinavia',
    years: 12,
    languages: 'English, Hindi, Punjabi',
  },
  {
    id: 'arjun',
    name: 'Arjun Nair',
    focus: 'Dubai, Thailand, Bali and Singapore',
    years: 8,
    languages: 'English, Hindi, Malayalam',
  },
  {
    id: 'tenzin',
    name: 'Tenzin Dorje',
    focus: 'Ladakh, Himachal, Sikkim and Bhutan',
    years: 10,
    languages: 'English, Hindi, Tibetan',
  },
  {
    id: 'ritika',
    name: 'Ritika Sen',
    focus: 'Honeymoons, Maldives and Mauritius',
    years: 9,
    languages: 'English, Hindi, Bengali',
  },
  {
    id: 'farhan',
    name: 'Farhan Ali',
    focus: 'Visas, groups and corporate offsites',
    years: 14,
    languages: 'English, Hindi, Urdu, Marathi',
  },
];

export interface TourPackage {
  id: string;
  title: string;
  /** Card subtitle: places and nights. */
  subtitle: string;
  nights: number;
  /** Per person on twin sharing, in rupees. */
  price: number;
  mrp: number;
  badge?: string;
  icon: IconKey;
  accent: AccentKey;
  hotel: string;
  highlights: string;
  /** Day-by-day plan for the PDF, one line per day. */
  plan: string;
  /** Refundable booking advance, in rupees. */
  advance: number;
}

export const DOMESTIC: readonly TourPackage[] = [
  {
    id: 'kerala',
    title: 'Kerala Backwaters & Hills',
    subtitle: 'Kochi · Munnar · Thekkady · Alleppey · 5 nights',
    nights: 5,
    price: 28_900,
    mrp: 34_500,
    badge: 'Bestseller',
    icon: 'plant',
    accent: 'green',
    hotel: '4★ resorts + 1 night private houseboat',
    highlights: 'Tea estates, spice plantation walk, Kathakali show, Alleppey houseboat',
    plan: 'Day 1: Kochi arrival, Fort Kochi walk\nDay 2: Drive to Munnar, tea museum\nDay 3: Eravikulam park, Mattupetty dam\nDay 4: Thekkady, spice walk and boating\nDay 5: Alleppey houseboat overnight\nDay 6: Kochi departure',
    advance: 10_000,
  },
  {
    id: 'goa',
    title: 'Goa Beach Break',
    subtitle: 'North & South Goa · 3 nights',
    nights: 3,
    price: 14_500,
    mrp: 18_000,
    badge: 'Weekend pick',
    icon: 'sports',
    accent: 'amber',
    hotel: '4★ beach resort in Candolim, breakfast included',
    highlights: 'Sunset cruise on the Mandovi, Old Goa churches, a day at Palolem',
    plan: 'Day 1: Arrival, evening at Candolim beach\nDay 2: North Goa forts and sunset cruise\nDay 3: South Goa, Old Goa churches, Palolem\nDay 4: Departure',
    advance: 5_000,
  },
  {
    id: 'ladakh',
    title: 'Ladakh Adventure',
    subtitle: 'Leh · Nubra · Pangong · 6 nights',
    nights: 6,
    price: 38_500,
    mrp: 44_000,
    badge: 'Season ends soon',
    icon: 'bike',
    accent: 'blue',
    hotel: 'Boutique hotel in Leh + Nubra and Pangong camps',
    highlights: 'Khardung La, Nubra sand dunes, a night beside Pangong Lake',
    plan: 'Day 1: Leh arrival, rest to acclimatise\nDay 2: Leh palace, Shanti Stupa\nDay 3: Khardung La to Nubra\nDay 4: Nubra to Pangong Lake\nDay 5: Pangong to Leh via Chang La\nDay 6: Hemis and Thiksey monasteries\nDay 7: Departure',
    advance: 12_000,
  },
  {
    id: 'rajasthan',
    title: 'Royal Rajasthan',
    subtitle: 'Jaipur · Jodhpur · Udaipur · 6 nights',
    nights: 6,
    price: 32_000,
    mrp: 38_000,
    icon: 'home',
    accent: 'orange',
    hotel: 'Heritage havelis, breakfast and dinner',
    highlights: 'Amber Fort, Mehrangarh at dusk, a boat ride on Lake Pichola',
    plan: 'Day 1: Jaipur arrival, Chokhi Dhani dinner\nDay 2: Amber Fort, City Palace\nDay 3: Drive to Jodhpur\nDay 4: Mehrangarh, blue city walk\nDay 5: Udaipur via Ranakpur\nDay 6: Udaipur palaces, Lake Pichola\nDay 7: Departure',
    advance: 10_000,
  },
  {
    id: 'kashmir',
    title: 'Kashmir Paradise',
    subtitle: 'Srinagar · Gulmarg · Pahalgam · 5 nights',
    nights: 5,
    price: 26_500,
    mrp: 31_000,
    icon: 'plant',
    accent: 'cyan',
    hotel: 'Deluxe houseboat + 4★ hotels',
    highlights: 'Shikara on Dal Lake, Gulmarg gondola, Betaab valley',
    plan: 'Day 1: Srinagar, shikara ride\nDay 2: Mughal gardens\nDay 3: Gulmarg gondola\nDay 4: Pahalgam, Betaab valley\nDay 5: Sonamarg day trip\nDay 6: Departure',
    advance: 8_000,
  },
];

export const INTERNATIONAL: readonly TourPackage[] = [
  {
    id: 'dubai',
    title: 'Dubai Delights',
    subtitle: 'Dubai · Abu Dhabi · 4 nights',
    nights: 4,
    price: 54_900,
    mrp: 62_000,
    badge: 'Visa included',
    icon: 'flight',
    accent: 'amber',
    hotel: '4★ hotel in Bur Dubai, breakfast included',
    highlights: 'Desert safari, Burj Khalifa level 124, Abu Dhabi mosque tour',
    plan: 'Day 1: Arrival, dhow cruise dinner\nDay 2: City tour, Burj Khalifa\nDay 3: Desert safari with BBQ\nDay 4: Abu Dhabi day trip\nDay 5: Departure',
    advance: 15_000,
  },
  {
    id: 'bali',
    title: 'Bali Escape',
    subtitle: 'Ubud · Seminyak · 5 nights',
    nights: 5,
    price: 62_500,
    mrp: 71_000,
    icon: 'plant',
    accent: 'teal',
    hotel: 'Pool villa in Ubud + beach resort in Seminyak',
    highlights: 'Rice terraces, Tanah Lot sunset, Nusa Penida day cruise',
    plan: 'Day 1: Arrival, transfer to Ubud\nDay 2: Rice terraces and swing\nDay 3: Kintamani volcano view\nDay 4: Move to Seminyak, Tanah Lot\nDay 5: Nusa Penida cruise\nDay 6: Departure',
    advance: 15_000,
  },
  {
    id: 'thailand',
    title: 'Thailand Explorer',
    subtitle: 'Bangkok · Phuket · Krabi · 5 nights',
    nights: 5,
    price: 48_000,
    mrp: 55_000,
    badge: 'Great value',
    icon: 'sports',
    accent: 'pink',
    hotel: '4★ hotels, breakfast included',
    highlights: 'Phi Phi island tour, Bangkok temples, Krabi four-island hop',
    plan: 'Day 1: Bangkok arrival, river cruise\nDay 2: Temples and Safari World\nDay 3: Fly to Phuket\nDay 4: Phi Phi islands\nDay 5: Krabi four islands\nDay 6: Departure',
    advance: 12_000,
  },
  {
    id: 'europe',
    title: 'Swiss Alps & Paris',
    subtitle: 'Paris · Lucerne · Interlaken · 7 nights',
    nights: 7,
    price: 1_89_000,
    mrp: 2_10_000,
    badge: 'Schengen help',
    icon: 'train',
    accent: 'indigo',
    hotel: '4★ city hotels, breakfast and 4 dinners',
    highlights: 'Eiffel Tower, Mt Titlis, Jungfraujoch, Swiss rail pass',
    plan: 'Day 1: Paris arrival, Seine cruise\nDay 2: Eiffel Tower, Louvre\nDay 3: Disneyland or Versailles\nDay 4: TGV to Lucerne\nDay 5: Mt Titlis\nDay 6: Interlaken, Jungfraujoch\nDay 7: Lake Brienz, free time\nDay 8: Departure from Zurich',
    advance: 40_000,
  },
  {
    id: 'singapore',
    title: 'Singapore Family Fun',
    subtitle: 'Singapore · Sentosa · 4 nights',
    nights: 4,
    price: 58_500,
    mrp: 66_000,
    badge: 'Kids love it',
    icon: 'family',
    accent: 'red',
    hotel: '4★ hotel near Orchard Road',
    highlights: 'Universal Studios, Night Safari, Gardens by the Bay',
    plan: 'Day 1: Arrival, Night Safari\nDay 2: City tour, Gardens by the Bay\nDay 3: Universal Studios\nDay 4: Sentosa, Wings of Time\nDay 5: Departure',
    advance: 15_000,
  },
];

export const HONEYMOON: readonly TourPackage[] = [
  {
    id: 'maldives',
    title: 'Maldives Overwater',
    subtitle: 'Water villa · all meals · 4 nights',
    nights: 4,
    price: 1_24_000,
    mrp: 1_42_000,
    badge: 'Couples’ favourite',
    icon: 'hotel',
    accent: 'cyan',
    hotel: '5★ island resort, water villa, all meals',
    highlights: 'Speedboat transfers, sunset cruise, candle-lit dinner on the sand',
    plan: 'Day 1: Speedboat to the resort\nDay 2: Snorkelling and spa\nDay 3: Sunset dolphin cruise\nDay 4: Private beach dinner\nDay 5: Departure',
    advance: 30_000,
  },
  {
    id: 'andaman',
    title: 'Andaman Romance',
    subtitle: 'Port Blair · Havelock · Neil · 5 nights',
    nights: 5,
    price: 36_000,
    mrp: 42_000,
    icon: 'sports',
    accent: 'blue',
    hotel: 'Beach resorts, breakfast and 2 dinners',
    highlights: 'Radhanagar beach, scuba at Havelock, flower-bed decoration',
    plan: 'Day 1: Port Blair, Cellular Jail light show\nDay 2: Ferry to Havelock\nDay 3: Scuba and Radhanagar beach\nDay 4: Neil Island\nDay 5: Back to Port Blair\nDay 6: Departure',
    advance: 10_000,
  },
  {
    id: 'mauritius',
    title: 'Mauritius Bliss',
    subtitle: 'Beach resort · half board · 5 nights',
    nights: 5,
    price: 92_000,
    mrp: 1_04_000,
    icon: 'hotel',
    accent: 'purple',
    hotel: '4★ beach resort, breakfast and dinner',
    highlights: 'Île aux Cerfs catamaran, Chamarel seven-coloured earth',
    plan: 'Day 1: Arrival, beach evening\nDay 2: North island tour\nDay 3: Île aux Cerfs catamaran\nDay 4: South island, Chamarel\nDay 5: Leisure and spa\nDay 6: Departure',
    advance: 25_000,
  },
];

/** Budget bands for the structured enquiry, per person. */
export const BUDGETS = [
  { id: 'b-25', title: 'Under ₹25,000', description: 'Short domestic breaks' },
  {
    id: 'b-50',
    title: '₹25,000 – ₹50,000',
    description: 'Most domestic holidays, short-haul abroad',
  },
  { id: 'b-100', title: '₹50,000 – ₹1 lakh', description: 'Dubai, Bali, Thailand, Singapore' },
  { id: 'b-200', title: '₹1 lakh – ₹2 lakh', description: 'Europe, Maldives, Mauritius' },
  { id: 'b-max', title: 'Above ₹2 lakh', description: 'Luxury stays and long journeys' },
] as const;

/** What the enquiry asks about first. */
export const TRIP_TYPES = [
  { id: 'domestic', title: 'Within India', description: 'Hills, beaches, heritage and wildlife' },
  { id: 'international', title: 'International', description: 'Short-haul and long-haul holidays' },
  { id: 'honeymoon', title: 'Honeymoon', description: 'Romantic stays and private experiences' },
  {
    id: 'group',
    title: 'Group or corporate',
    description: 'Offsites, school trips, family reunions',
  },
] as const;

/** The three hotel tiers every quote compares, as a share of the base price. */
export const QUOTE_TIERS = [
  { id: 'value', name: 'Value', stay: '3★ hotels', factor: 0.8 },
  { id: 'comfort', name: 'Comfort', stay: '4★ hotels', factor: 1 },
  { id: 'luxe', name: 'Luxe', stay: '5★ resorts', factor: 1.45 },
] as const;

/** `₹1,200` — for row descriptions and document cells, which are plain text. */
export const rupees = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

/**
 * Spotlight Live's dummy catalogue: the company, its touring events and their ticket tiers,
 * hands-on workshops, private-event venues and the cities it sends alerts for. Fictional
 * names, numbers and `.example` links.
 */
import type { AccentKey, IconKey } from '../../visuals';

export const COMPANY = {
  name: 'Spotlight Live',
  phone: '+91 80 4718 2000',
  email: 'hello@spotlightlive.example',
  website: 'https://spotlightlive.example',
  address: '3rd Floor, Embassy Tech Square, Outer Ring Road, Bengaluru 560103',
  studio: 'Spotlight Studio, 12th Main, Indiranagar, Bengaluru 560038',
  studioLat: 12.9716,
  studioLng: 77.6412,
  online: 'https://live.spotlightlive.example/join',
  myTickets: 'https://spotlightlive.example/my-tickets',
  planner: 'https://spotlightlive.example/private-events',
  review: 'https://reviews.spotlightlive.example',
} as const;

/** Who a support chat is handed to. */
export const SUPPORT = {
  agentName: 'Kabir (Spotlight Live support)',
  name: 'Kabir Malhotra',
  phone: '+91 80 4718 2099',
  role: 'Ticketing support lead',
} as const;

/** The private-events planner every enquiry is handed to. */
export const PLANNER = {
  agentName: 'Tanvi (Private events)',
  name: 'Tanvi Deshpande',
  phone: '+91 98860 41275',
  role: 'Senior event planner',
} as const;

export interface Tier {
  id: string;
  name: string;
  description: string;
  /** Price per ticket in rupees, GST included. */
  price: number;
}

export interface LiveEvent {
  key: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: IconKey;
  accent: AccentKey;
  venue: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  gate: string;
  map: string;
  /** Doors open this long before the show, in minutes. */
  doorsMin: number;
  ageLimit: string;
  tiers: readonly Tier[];
}

/** Five touring events, each with several show dates and three ticket tiers. */
export const EVENTS: readonly LiveEvent[] = [
  {
    key: 'monsoon-beats',
    title: 'Monsoon Beats Festival',
    subtitle: 'Indie, electronic and Bollywood live · 6 artists on 2 stages',
    badge: 'Selling fast',
    icon: 'music',
    accent: 'purple',
    venue: 'Harbour Grounds, BKC',
    address: 'Harbour Grounds, G Block, Bandra Kurla Complex, Mumbai 400051',
    city: 'Mumbai',
    lat: 19.0662,
    lng: 72.8654,
    gate: 'Gate 3 (MMRDA side)',
    map: 'https://maps.spotlightlive.example/harbour-grounds',
    doorsMin: 90,
    ageLimit: '16+',
    tiers: [
      { id: 'mb-ga', name: 'General Access', description: 'Standing, both stages', price: 1499 },
      { id: 'mb-pit', name: 'Fan Pit', description: 'Front of main stage, fast lane', price: 2999 },
      {
        id: 'mb-vip',
        name: 'VIP Lounge',
        description: 'Raised deck, lounge seating, food court',
        price: 5999,
      },
    ],
  },
  {
    key: 'laugh-riot',
    title: 'Laugh Riot: Stand-up Night',
    subtitle: 'Four comics, one mic, 2 hours of fresh material',
    badge: 'New dates',
    icon: 'movie',
    accent: 'amber',
    venue: 'The Comedy Loft, Koramangala',
    address: '4th Floor, 80 Feet Road, Koramangala 4th Block, Bengaluru 560034',
    city: 'Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    gate: 'Main entrance, 4th floor',
    map: 'https://maps.spotlightlive.example/comedy-loft',
    doorsMin: 45,
    ageLimit: '18+',
    tiers: [
      { id: 'lr-silver', name: 'Silver', description: 'Rows H–M, great sightlines', price: 599 },
      { id: 'lr-gold', name: 'Gold', description: 'Rows C–G, closer to the stage', price: 899 },
      {
        id: 'lr-front',
        name: 'Front Row',
        description: 'Rows A–B, you may get roasted',
        price: 1299,
      },
    ],
  },
  {
    key: 'founders-mixer',
    title: 'Founders Mixer Night',
    subtitle: 'Fireside chats, 20 startup demos and open networking',
    badge: 'Registration open',
    icon: 'group',
    accent: 'blue',
    venue: 'Hitech Convention Hall',
    address: 'Hall 2, HITEC City Main Road, Madhapur, Hyderabad 500081',
    city: 'Hyderabad',
    lat: 17.4474,
    lng: 78.3762,
    gate: 'Registration desk, Hall 2 foyer',
    map: 'https://maps.spotlightlive.example/hitech-hall',
    doorsMin: 60,
    ageLimit: 'All ages',
    tiers: [
      {
        id: 'fm-startup',
        name: 'Startup Pass',
        description: 'For founders of startups under 3 years',
        price: 1999,
      },
      {
        id: 'fm-delegate',
        name: 'Delegate',
        description: 'All talks, demos and dinner',
        price: 3499,
      },
      {
        id: 'fm-all',
        name: 'All-Access',
        description: 'Delegate + investor lounge + speaker meet',
        price: 7999,
      },
    ],
  },
  {
    key: 'food-carnival',
    title: 'Street Food Carnival',
    subtitle: '60 stalls from 12 states, live music and a craft market',
    icon: 'food',
    accent: 'orange',
    venue: 'Jawaharlal Nehru Stadium Lawns',
    address: 'Gate 14, Jawaharlal Nehru Stadium, Lodhi Road, New Delhi 110003',
    city: 'New Delhi',
    lat: 28.5828,
    lng: 77.2344,
    gate: 'Gate 14',
    map: 'https://maps.spotlightlive.example/jln-lawns',
    doorsMin: 0,
    ageLimit: 'All ages',
    tiers: [
      { id: 'fc-entry', name: 'Entry', description: 'Entry only, pay at stalls', price: 299 },
      {
        id: 'fc-tasting',
        name: 'Tasting Pass',
        description: 'Entry + 8 tasting coupons',
        price: 899,
      },
      {
        id: 'fc-family',
        name: 'Family Pass',
        description: 'Per adult, kids under 10 free',
        price: 649,
      },
    ],
  },
  {
    key: 'sufi-nights',
    title: 'Sufi Nights by the River',
    subtitle: 'Qawwali and Sufi folk under the stars',
    badge: 'Limited seats',
    icon: 'music',
    accent: 'indigo',
    venue: 'Riverside Amphitheatre',
    address: 'Riverside Amphitheatre, Koregaon Park Annexe, Pune 411001',
    city: 'Pune',
    lat: 18.5362,
    lng: 73.8939,
    gate: 'East gate, near the boat club',
    map: 'https://maps.spotlightlive.example/riverside',
    doorsMin: 60,
    ageLimit: 'All ages',
    tiers: [
      { id: 'sn-lawn', name: 'Lawn', description: 'Floor cushions on the lawn', price: 999 },
      { id: 'sn-chair', name: 'Chairs', description: 'Reserved chair, rows 8–20', price: 1799 },
      {
        id: 'sn-premium',
        name: 'Premium',
        description: 'Rows 1–7, welcome drink, meet the artists',
        price: 2999,
      },
    ],
  },
];

/** How many tickets a buyer can pick, with the convenience fee for that many. */
export const QUANTITIES = [
  { id: 'one', title: '1 ticket', qty: 1, fee: 59 },
  { id: 'two', title: '2 tickets', qty: 2, fee: 99 },
  { id: 'four', title: '4 tickets', qty: 4, fee: 179 },
] as const;

export interface Workshop {
  id: string;
  title: string;
  description: string;
  mentor: string;
  mentorBio: string;
  /** Seat fee in rupees, GST included. */
  fee: number;
  mrp: number;
  /** Materials kit in rupees; 0 when nothing to take home. */
  kit: number;
  hours: string;
  seats: number;
  bring: string;
}

export interface WorkshopGroup {
  id: string;
  title: string;
  workshops: readonly Workshop[];
}

export const WORKSHOPS: readonly WorkshopGroup[] = [
  {
    id: 'creative',
    title: 'Creative',
    workshops: [
      {
        id: 'pottery',
        title: 'Wheel Pottery Basics',
        description: 'Throw, trim and glaze two pieces of your own',
        mentor: 'Meher Kapoor',
        mentorBio: 'Studio potter, 12 years at the wheel',
        fee: 1800,
        mrp: 2200,
        kit: 450,
        hours: '3 hours',
        seats: 12,
        bring: 'Clothes that can get muddy; short nails help',
      },
      {
        id: 'watercolour',
        title: 'Watercolour Landscapes',
        description: 'Washes, layering and skies in one sitting',
        mentor: 'Arnav Sengupta',
        mentorBio: 'Illustrator and plein-air painter',
        fee: 1200,
        mrp: 1500,
        kit: 350,
        hours: '2.5 hours',
        seats: 16,
        bring: 'Nothing; paper, paints and brushes are in the kit',
      },
      {
        id: 'photo',
        title: 'Phone Photography',
        description: 'Light, framing and editing on the phone you own',
        mentor: 'Rhea Fernandes',
        mentorBio: 'Travel photographer, 200k followers',
        fee: 999,
        mrp: 1299,
        kit: 0,
        hours: '3 hours incl. photo walk',
        seats: 20,
        bring: 'A charged phone with 2 GB free',
      },
    ],
  },
  {
    id: 'career',
    title: 'Career and skills',
    workshops: [
      {
        id: 'speaking',
        title: 'Public Speaking Lab',
        description: 'Structure a talk and deliver it on camera',
        mentor: 'Vikram Sethi',
        mentorBio: 'TEDx speaker and corporate trainer',
        fee: 2499,
        mrp: 2999,
        kit: 0,
        hours: '4 hours',
        seats: 14,
        bring: 'A 2-minute topic you care about',
      },
      {
        id: 'excel',
        title: 'Excel Dashboards',
        description: 'Pivot tables, charts and a live sales dashboard',
        mentor: 'Neha Agarwal',
        mentorBio: 'Chartered accountant and analytics coach',
        fee: 1499,
        mrp: 1999,
        kit: 0,
        hours: '3 hours',
        seats: 24,
        bring: 'A laptop with Excel 2019 or later',
      },
      {
        id: 'pm',
        title: 'Product Management 101',
        description: 'From problem to roadmap with real case studies',
        mentor: 'Siddharth Rao',
        mentorBio: 'Product lead at two unicorns',
        fee: 2999,
        mrp: 3999,
        kit: 0,
        hours: '5 hours with lunch',
        seats: 30,
        bring: 'A laptop or notebook',
      },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Food and wellness',
    workshops: [
      {
        id: 'sourdough',
        title: 'Sourdough at Home',
        description: 'Starter, shaping and baking a loaf you take home',
        mentor: 'Chef Farhan Ali',
        mentorBio: 'Artisan baker, Bandra',
        fee: 1999,
        mrp: 2499,
        kit: 600,
        hours: '4 hours',
        seats: 10,
        bring: 'An apron; we send the starter home with you',
      },
      {
        id: 'breathwork',
        title: 'Yoga and Breathwork',
        description: 'Pranayama, gentle flow and a guided wind-down',
        mentor: 'Ishita Menon',
        mentorBio: 'E-RYT 500 yoga teacher',
        fee: 799,
        mrp: 999,
        kit: 0,
        hours: '2 hours',
        seats: 25,
        bring: 'Comfortable clothes; mats are provided',
      },
      {
        id: 'robotics',
        title: 'Kids Robotics (8–12)',
        description: 'Build and code a line-following robot',
        mentor: 'Aditya Kulkarni',
        mentorBio: 'STEM educator, 9 years',
        fee: 1599,
        mrp: 1999,
        kit: 900,
        hours: '3 hours',
        seats: 15,
        bring: 'A parent for the last 15-minute demo',
      },
    ],
  },
];

export interface Venue {
  id: string;
  title: string;
  subtitle: string;
  /** Starting price per guest, rupees. */
  perGuest: number;
  capacity: string;
  badge?: string;
  icon: IconKey;
}

/** Venues for groups up to 150 guests. */
export const SMALL_VENUES: readonly Venue[] = [
  {
    id: 'rooftop',
    title: 'Skyline Rooftop, Indiranagar',
    subtitle: 'Open-air deck with city views · DJ console',
    perGuest: 1800,
    capacity: '40–120 guests',
    badge: 'Most booked',
    icon: 'realestate',
  },
  {
    id: 'courtyard',
    title: 'The Courtyard Café, Jayanagar',
    subtitle: 'Heritage bungalow garden · in-house catering',
    perGuest: 1400,
    capacity: '30–100 guests',
    icon: 'coffee',
  },
  {
    id: 'boardroom',
    title: 'Studio 12 Event Room',
    subtitle: 'AV-ready hall for launches and offsites',
    perGuest: 1200,
    capacity: '20–80 guests',
    icon: 'business',
  },
];

/** Venues for 150 guests and more. */
export const LARGE_VENUES: readonly Venue[] = [
  {
    id: 'lawns',
    title: 'Palm Grove Lawns, Whitefield',
    subtitle: 'Two acres of lawn · stage, lights and parking for 300',
    perGuest: 1600,
    capacity: '150–1,200 guests',
    badge: 'Weddings',
    icon: 'plant',
  },
  {
    id: 'ballroom',
    title: 'Grand Ballroom, Hotel Meridian',
    subtitle: 'Pillarless hall · 5-star banquet menu',
    perGuest: 2600,
    capacity: '200–800 guests',
    badge: 'Corporate',
    icon: 'hotel',
  },
  {
    id: 'convention',
    title: 'Lakeside Convention Centre',
    subtitle: 'Three halls, breakout rooms and a lake promenade',
    perGuest: 2100,
    capacity: '300–2,000 guests',
    icon: 'event',
  },
];

/** Private-event kinds the planner handles. */
export const OCCASIONS = [
  {
    id: 'corporate',
    title: 'Corporate event',
    description: 'Offsites, launches, annual days and townhalls',
  },
  { id: 'wedding', title: 'Wedding or sangeet', description: 'Mehendi, sangeet, reception' },
  {
    id: 'birthday',
    title: 'Birthday or anniversary',
    description: 'Milestone birthdays, surprise parties',
  },
  {
    id: 'conference',
    title: 'Conference or meetup',
    description: 'Registrations, badges, stage and streaming',
  },
  { id: 'college', title: 'College fest', description: 'Artists, stage, ticketing and security' },
] as const;

/** Rough guest-count bands for the button fallback when free text is not understood. */
export const GUEST_BANDS = [
  { id: 'small', title: 'Up to 50', guests: '50' },
  { id: 'medium', title: '50 to 150', guests: '120' },
  { id: 'large', title: 'More than 150', guests: '300' },
] as const;

/** Budget bands, rupees, for the same fallback. */
export const BUDGET_BANDS = [
  { id: 'b-1', title: 'Under ₹1 lakh', description: 'Small get-togethers', budget: '₹1 lakh' },
  { id: 'b-3', title: '₹1–3 lakh', description: 'Parties and offsites', budget: '₹3 lakh' },
  { id: 'b-10', title: '₹3–10 lakh', description: 'Large parties, launches', budget: '₹10 lakh' },
  { id: 'b-25', title: '₹10–25 lakh', description: 'Weddings and conferences', budget: '₹25 lakh' },
  {
    id: 'b-more',
    title: 'Above ₹25 lakh',
    description: 'Destination and multi-day',
    budget: '₹25 lakh+',
  },
] as const;

/** Cities with event alerts. */
export const CITIES = [
  { id: 'mumbai', title: 'Mumbai', description: 'Concerts, comedy and festivals' },
  { id: 'bengaluru', title: 'Bengaluru', description: 'Comedy, workshops and tech meetups' },
  { id: 'delhi', title: 'Delhi NCR', description: 'Food festivals, concerts and theatre' },
  { id: 'pune', title: 'Pune', description: 'Music nights and weekend workshops' },
  { id: 'hyderabad', title: 'Hyderabad', description: 'Startup events and live music' },
  { id: 'chennai', title: 'Chennai', description: 'Carnatic, sabhas and stand-up' },
  { id: 'kolkata', title: 'Kolkata', description: 'Theatre, book fairs and Pujo specials' },
] as const;

/** What a subscriber wants to hear about. */
export const INTERESTS = [
  { id: 'all', title: 'Everything', description: 'Every new event in your city' },
  { id: 'music', title: 'Music', description: 'Concerts, festivals and gigs' },
  { id: 'comedy', title: 'Comedy', description: 'Stand-up and improv' },
  { id: 'workshops', title: 'Workshops', description: 'Art, career and wellness classes' },
  { id: 'food', title: 'Food and markets', description: 'Food fests and flea markets' },
] as const;

/** `₹1,200` — for row descriptions, which are plain text. */
export const rupees = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

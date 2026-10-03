/**
 * Aura Skin & Smile Clinic's dummy catalogue: the clinic, its dermatologists and dentists, skin
 * concerns, dental services, aesthetic treatments and the aftercare for each procedure.
 * Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const CLINIC = {
  name: 'Aura Skin & Smile Clinic, Bandra West',
  phone: '+91 22 4890 2200',
  urgent: '+91 22 4890 2299',
  address: '2nd floor, Sea Breeze Arcade, 14th Road, Khar–Bandra West, Mumbai 400050',
  lat: 19.0664,
  lng: 72.8335,
  website: 'https://auraclinic.example',
  video: 'https://auraclinic.example/video-consult',
  review: 'https://reviews.auraclinic.example/bandra',
  gallery: 'https://auraclinic.example/results',
} as const;

/** Who an aftercare escalation is handed to. */
export const DOCTOR_ON_CALL = {
  agentName: 'Dr. Meghna Bhatt (Doctor on call)',
  name: 'Dr. Meghna Bhatt',
  phone: '+91 98200 41177',
  role: 'Consultant dermatologist, on call for post-procedure care',
} as const;

/** The front desk, for questions and changes. */
export const FRONT_DESK = {
  agentName: 'Rhea (Aura front desk)',
  name: 'Rhea Fernandes',
  phone: '+91 22 4890 2201',
  role: 'Patient coordinator',
} as const;

export interface Specialist {
  id: string;
  name: string;
  qualification: string;
  focus: string;
  years: number;
  /** In-clinic consultation fee in rupees. */
  fee: number;
  /** Video consultation fee in rupees. */
  videoFee: number;
  room: string;
}

export const DERMATOLOGISTS: readonly Specialist[] = [
  {
    id: 'dr-qureshi',
    name: 'Dr. Sana Qureshi',
    qualification: 'MD (Dermatology, Venereology & Leprosy)',
    focus: 'Acne, scars and pigmentation',
    years: 12,
    fee: 1200,
    videoFee: 900,
    room: 'Derma Suite 1',
  },
  {
    id: 'dr-deshpande',
    name: 'Dr. Aditya Deshpande',
    qualification: 'MD, DNB · Trichology',
    focus: 'Hair fall, dandruff and scalp care',
    years: 9,
    fee: 1000,
    videoFee: 800,
    room: 'Derma Suite 2',
  },
  {
    id: 'dr-bhatt',
    name: 'Dr. Meghna Bhatt',
    qualification: 'MD · Cosmetic dermatology and lasers',
    focus: 'Anti-ageing, lasers and injectables',
    years: 15,
    fee: 1500,
    videoFee: 1200,
    room: 'Laser Suite',
  },
  {
    id: 'dr-nair',
    name: 'Dr. Rohit Nair',
    qualification: 'DVD · Paediatric and allergy skin',
    focus: 'Eczema, rashes and children’s skin',
    years: 7,
    fee: 900,
    videoFee: 700,
    room: 'Derma Suite 3',
  },
];

export interface SkinConcern {
  id: string;
  title: string;
  description: string;
  /** What to bring or avoid before the consultation. */
  prep: string;
}

export const SKIN_CONCERNS: readonly SkinConcern[] = [
  {
    id: 'acne',
    title: 'Acne and acne scars',
    description: 'Breakouts, blackheads, marks and pitted scars',
    prep: 'Come without make-up and bring the creams or tablets you use now.',
  },
  {
    id: 'pigment',
    title: 'Pigmentation, melasma',
    description: 'Dark spots, uneven tone, tanning and patches',
    prep: 'Bring your sunscreen and any skin-lightening creams you have tried.',
  },
  {
    id: 'hair',
    title: 'Hair fall, dandruff',
    description: 'Thinning, bald patches, itchy or flaky scalp',
    prep: 'Wash your hair the day before and bring any recent blood reports.',
  },
  {
    id: 'eczema',
    title: 'Eczema, itching, rashes',
    description: 'Dry patches, allergies, hives and psoriasis',
    prep: 'Note when the itching started and bring photos of flare-ups.',
  },
  {
    id: 'moles',
    title: 'Moles, warts, skin tags',
    description: 'Check a changing mole, or remove warts and tags',
    prep: 'Point out any mole that has changed in size, colour or shape.',
  },
  {
    id: 'ageing',
    title: 'Fine lines, dull skin',
    description: 'Wrinkles, sagging, dark circles and texture',
    prep: 'Come without make-up so we can assess your skin properly.',
  },
  {
    id: 'nails',
    title: 'Nail problems',
    description: 'Fungal nails, brittle or discoloured nails',
    prep: 'Remove nail polish before the visit.',
  },
];

export interface DentalService {
  id: string;
  title: string;
  description: string;
  dentist: string;
  dentistQual: string;
  fee: number;
  /** The add-on done at the first visit, and its price in rupees. */
  extraName: string;
  extraPrice: number;
  chair: string;
}

export const DENTAL_SERVICES: readonly DentalService[] = [
  {
    id: 'cleaning',
    title: 'Check-up and cleaning',
    description: 'Scaling, polishing and a full oral check',
    dentist: 'Dr. Kabir Malhotra',
    dentistQual: 'MDS (Endodontics), 14 yrs',
    fee: 500,
    extraName: 'Scaling and polishing',
    extraPrice: 1200,
    chair: 'Dental Chair 1',
  },
  {
    id: 'toothache',
    title: 'Toothache, root canal',
    description: 'Pain, sensitivity, decay or a broken filling',
    dentist: 'Dr. Kabir Malhotra',
    dentistQual: 'MDS (Endodontics), 14 yrs',
    fee: 500,
    extraName: 'Digital X-ray (IOPA)',
    extraPrice: 300,
    chair: 'Dental Chair 1',
  },
  {
    id: 'aligners',
    title: 'Braces and aligners',
    description: 'Crooked teeth, gaps and bite correction',
    dentist: 'Dr. Tanvi Shah',
    dentistQual: 'MDS (Orthodontics), 10 yrs',
    fee: 800,
    extraName: 'OPG full-mouth X-ray',
    extraPrice: 600,
    chair: 'Ortho Room',
  },
  {
    id: 'wisdom',
    title: 'Wisdom tooth, extraction',
    description: 'Impacted or painful wisdom teeth, extractions',
    dentist: 'Dr. Farhan Ali',
    dentistQual: 'MDS (Oral surgery), 16 yrs',
    fee: 1000,
    extraName: 'OPG full-mouth X-ray',
    extraPrice: 600,
    chair: 'Minor OT',
  },
  {
    id: 'whitening',
    title: 'Teeth whitening',
    description: 'In-clinic whitening, up to 6 shades brighter',
    dentist: 'Dr. Tanvi Shah',
    dentistQual: 'MDS (Orthodontics), 10 yrs',
    fee: 500,
    extraName: 'Shade check and polish',
    extraPrice: 500,
    chair: 'Smile Studio',
  },
  {
    id: 'implants',
    title: 'Implants, missing teeth',
    description: 'Implants, crowns and bridges',
    dentist: 'Dr. Farhan Ali',
    dentistQual: 'MDS (Oral surgery), 16 yrs',
    fee: 1000,
    extraName: 'CBCT 3D jaw scan',
    extraPrice: 2500,
    chair: 'Minor OT',
  },
  {
    id: 'kids',
    title: 'Kids’ dentistry',
    description: 'First visit, cavities and fluoride for 2–14 yrs',
    dentist: 'Dr. Isha Kapoor',
    dentistQual: 'MDS (Paediatric dentistry), 8 yrs',
    fee: 700,
    extraName: 'Fluoride varnish',
    extraPrice: 400,
    chair: 'Kids’ Corner',
  },
];

export interface Treatment {
  id: string;
  title: string;
  subtitle: string;
  icon: IconKey;
  /** Single-session price in rupees, and the list price it is discounted from. */
  price: number;
  mrp: number;
  badge?: string;
  minutes: number;
  downtime: string;
  /** Number of sessions in the package, and its price; `packagePrice` 0 = consult only. */
  sessions: number;
  packagePrice: number;
  patchTest: 'yes' | 'no';
  /** The `PROCEDURES` entry whose aftercare applies. */
  aftercare: string;
}

export const TREATMENTS: readonly Treatment[] = [
  {
    id: 'hydrafacial',
    title: 'HydraFacial MD',
    subtitle: 'Deep cleanse, exfoliation and hydration · 60 min',
    icon: 'spa',
    price: 4500,
    mrp: 6000,
    badge: 'Bestseller',
    minutes: 60,
    downtime: 'None — glow the same day',
    sessions: 4,
    packagePrice: 15_500,
    patchTest: 'no',
    aftercare: 'hydrafacial',
  },
  {
    id: 'peel',
    title: 'Chemical peel',
    subtitle: 'Glycolic or salicylic peel for acne marks and tan · 30 min',
    icon: 'beauty',
    price: 2800,
    mrp: 3500,
    minutes: 30,
    downtime: '2–4 days of mild peeling',
    sessions: 6,
    packagePrice: 14_000,
    patchTest: 'yes',
    aftercare: 'peel',
  },
  {
    id: 'lhr',
    title: 'Laser hair reduction',
    subtitle: 'US-FDA cleared diode laser · face or underarms',
    icon: 'star',
    price: 3500,
    mrp: 5000,
    badge: 'Package saves 25%',
    minutes: 30,
    downtime: 'None — mild redness for a few hours',
    sessions: 6,
    packagePrice: 15_750,
    patchTest: 'yes',
    aftercare: 'laser',
  },
  {
    id: 'qswitch',
    title: 'Q-switch laser toning',
    subtitle: 'Pigmentation, melasma and dull skin · 30 min',
    icon: 'beauty',
    price: 4000,
    mrp: 5500,
    minutes: 30,
    downtime: 'Mild redness for a day',
    sessions: 6,
    packagePrice: 20_000,
    patchTest: 'yes',
    aftercare: 'laser',
  },
  {
    id: 'microneedling',
    title: 'Microneedling (MNRF)',
    subtitle: 'Acne scars, open pores and texture · 45 min',
    icon: 'beauty',
    price: 6000,
    mrp: 8000,
    minutes: 45,
    downtime: '2–3 days of redness',
    sessions: 4,
    packagePrice: 21_000,
    patchTest: 'no',
    aftercare: 'mnrf',
  },
  {
    id: 'prp',
    title: 'PRP for hair',
    subtitle: 'Your own platelets to slow hair fall · 60 min',
    icon: 'spa',
    price: 6500,
    mrp: 8500,
    minutes: 60,
    downtime: 'Scalp tenderness for a day',
    sessions: 4,
    packagePrice: 22_000,
    patchTest: 'no',
    aftercare: 'mnrf',
  },
  {
    id: 'injectables',
    title: 'Anti-wrinkle and fillers',
    subtitle: 'Doctor consultation first · treatment plan and quote',
    icon: 'doctor',
    price: 1500,
    mrp: 1500,
    badge: 'Consult first',
    minutes: 30,
    downtime: 'Planned at the consultation',
    sessions: 1,
    packagePrice: 0,
    patchTest: 'no',
    aftercare: 'injectables',
  },
];

export interface Procedure {
  id: string;
  title: string;
  description: string;
  /** Normal for the first few days. */
  normal: string;
  /** Aftercare instructions, one line each (≤ 500 characters in all). */
  aftercare: string;
}

export const PROCEDURES: readonly Procedure[] = [
  {
    id: 'laser',
    title: 'Laser session',
    description: 'Hair reduction or Q-switch toning',
    normal: 'mild redness, warmth and small bumps for up to 24 hours',
    aftercare:
      '• SPF 50 every 3 hours outdoors\n• No waxing, threading or bleach for 2 weeks\n• Skip the gym, sauna and swimming for 48 hours\n• Ice packs wrapped in a cloth for any warmth',
  },
  {
    id: 'peel',
    title: 'Chemical peel',
    description: 'Glycolic, salicylic or TCA peel',
    normal: 'tightness, flaking and light peeling for 2–4 days',
    aftercare:
      '• Do not pick or scrub the peeling skin\n• Gentle cleanser and plain moisturiser only\n• No retinol or AHA creams for 5 days\n• SPF 50 every 3 hours outdoors',
  },
  {
    id: 'hydrafacial',
    title: 'HydraFacial',
    description: 'Cleanse, extraction and hydration',
    normal: 'a little pinkness for an hour or two',
    aftercare:
      '• No make-up for 6 hours\n• No scrubs, peels or retinol for 48 hours\n• Drink plenty of water and use SPF daily',
  },
  {
    id: 'mnrf',
    title: 'Microneedling, PRP',
    description: 'MNRF, microneedling or PRP for hair',
    normal: 'redness, pin-point spots and tenderness for 2–3 days',
    aftercare:
      '• Do not wash the area for 12 hours\n• No make-up or hair colour for 3 days\n• Avoid sun, swimming and steam for a week\n• Paracetamol is fine for soreness; avoid aspirin',
  },
  {
    id: 'injectables',
    title: 'Anti-wrinkle, fillers',
    description: 'Botulinum toxin or hyaluronic fillers',
    normal: 'small bumps or a light bruise at the injection points',
    aftercare:
      '• Stay upright for 4 hours; do not lie face down\n• Do not rub or massage the area for 24 hours\n• No heavy workouts, alcohol or facials for 24 hours',
  },
  {
    id: 'rct',
    title: 'Root canal',
    description: 'Root canal treatment or a deep filling',
    normal: 'a dull ache when biting for 2–3 days',
    aftercare:
      '• Do not chew on that side until the crown is fitted\n• Take the painkiller as prescribed\n• Brush and floss gently as usual',
  },
  {
    id: 'extraction',
    title: 'Tooth extraction',
    description: 'Wisdom tooth or a simple extraction',
    normal: 'mild swelling and oozing for the first 24 hours',
    aftercare:
      '• Bite on the gauze for 45 minutes\n• No spitting, straws or smoking for 72 hours\n• Cold, soft food today; warm salt-water rinses from tomorrow\n• Ice pack on the cheek, 10 minutes on and off',
  },
];

export const rupees = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

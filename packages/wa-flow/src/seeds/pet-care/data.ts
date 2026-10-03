/**
 * PawPal Pet Clinic & Spa's dummy catalogue: the clinic, vets, visit reasons, grooming
 * packages, pet vaccines and breeds. Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const CLINIC = {
  name: 'PawPal Pet Clinic & Spa, Jubilee Hills',
  phone: '+91 40 4520 7700',
  emergency: '+91 40 4520 7711',
  address: 'Plot 214, Road No. 36, Jubilee Hills, Hyderabad 500033',
  lat: 17.4302,
  lng: 78.4071,
  website: 'https://pawpal.example',
  video: 'https://pawpal.example/video-consult',
  directions: 'https://maps.pawpal.example/jubilee-hills',
  review: 'https://reviews.pawpal.example/jubilee-hills',
} as const;

/** The vet on call every urgent question is handed to. */
export const VET_ON_CALL = {
  agentName: 'Dr. Farah Siddiqui (Vet on call)',
  name: 'Dr. Farah Siddiqui',
  phone: '+91 40 4520 7722',
  role: 'Veterinarian on call',
} as const;

export const GROOMER = {
  name: 'Kiran Rao',
  phone: '+91 98490 33120',
  role: 'Senior groomer, mobile spa van',
} as const;

export interface Vet {
  id: string;
  name: string;
  qualification: string;
  focus: string;
  years: number;
  /** Clinic consultation fee, rupees. */
  fee: number;
}

export const VETS: readonly Vet[] = [
  {
    id: 'dr-reddy',
    name: 'Dr. Sravani Reddy',
    qualification: 'BVSc, MVSc (Medicine)',
    focus: 'General medicine, senior pets',
    years: 12,
    fee: 700,
  },
  {
    id: 'dr-thomas',
    name: 'Dr. Allen Thomas',
    qualification: 'BVSc, MVSc (Surgery)',
    focus: 'Surgery, injuries, orthopaedics',
    years: 15,
    fee: 900,
  },
  {
    id: 'dr-nair',
    name: 'Dr. Meera Nair',
    qualification: 'BVSc · Dermatology',
    focus: 'Skin, coat, allergies, ticks',
    years: 8,
    fee: 650,
  },
  {
    id: 'dr-chopra',
    name: 'Dr. Arjun Chopra',
    qualification: 'BVSc · Feline medicine',
    focus: 'Cats, kittens and small pets',
    years: 9,
    fee: 650,
  },
];

/** Why the pet is coming in. `urgent` rows go to the emergency path. */
export const CONCERNS = [
  { id: 'checkup', title: 'Wellness check-up', description: 'Annual exam, weight, diet advice' },
  {
    id: 'skin',
    title: 'Skin, itching, ticks',
    description: 'Scratching, hair loss, rashes, fleas',
  },
  { id: 'tummy', title: 'Vomiting or loose motion', description: 'Not eating, upset stomach' },
  { id: 'limping', title: 'Limping or pain', description: 'Injury, stiffness, joint pain' },
  { id: 'dental', title: 'Teeth and mouth', description: 'Bad breath, tartar, broken tooth' },
  { id: 'behaviour', title: 'Behaviour', description: 'Aggression, anxiety, toilet training' },
] as const;

export interface GroomPackage {
  id: string;
  title: string;
  subtitle: string;
  /** Small-pet price, rupees; bigger pets pay the size surcharge. */
  price: number;
  mrp: number;
  minutes: number;
  badge?: string;
  icon: IconKey;
}

export const GROOMING: readonly GroomPackage[] = [
  {
    id: 'bath',
    title: 'Bath & brush',
    subtitle: 'Shampoo, blow-dry, brushing, ear clean',
    price: 899,
    mrp: 1200,
    minutes: 60,
    icon: 'water',
  },
  {
    id: 'full',
    title: 'Full groom',
    subtitle: 'Bath, haircut, nail trim, paw and ear care',
    price: 1499,
    mrp: 1999,
    minutes: 120,
    badge: 'Most loved',
    icon: 'spa',
  },
  {
    id: 'tick',
    title: 'Tick & flea spa',
    subtitle: 'Medicated bath, tick removal, coat serum',
    price: 1299,
    mrp: 1700,
    minutes: 90,
    icon: 'search',
  },
  {
    id: 'puppy',
    title: 'Puppy first groom',
    subtitle: 'Gentle bath and trim for pups under 6 months',
    price: 699,
    mrp: 900,
    minutes: 45,
    badge: 'Gentle',
    icon: 'heart',
  },
  {
    id: 'cat-spa',
    title: 'Cat spa',
    subtitle: 'Low-stress bath, de-shedding, nail trim',
    price: 1199,
    mrp: 1500,
    minutes: 75,
    icon: 'pet',
  },
];

export const PET_SIZES = [
  { id: 'small', title: 'Small (under 10 kg)', short: 'Small', fee: 0 },
  { id: 'medium', title: 'Medium (10–25 kg)', short: 'Medium', fee: 300 },
  { id: 'large', title: 'Large (over 25 kg)', short: 'Large', fee: 600 },
] as const;

export interface PetVaccine {
  id: string;
  name: string;
  detail: string;
  price: number;
}

export const DOG_VACCINES: readonly PetVaccine[] = [
  {
    id: 'dhppi',
    name: 'DHPPi booster',
    detail: 'Distemper, hepatitis, parvo · yearly',
    price: 650,
  },
  { id: 'rabies', name: 'Anti-rabies', detail: 'Yearly · required by law', price: 450 },
  { id: 'lepto', name: 'Leptospirosis', detail: 'Yearly · monsoon risk', price: 550 },
  { id: 'kennel', name: 'Kennel cough', detail: 'Before boarding or daycare', price: 900 },
  { id: 'corona', name: 'Canine coronavirus', detail: 'Puppies and yearly booster', price: 500 },
];

export const CAT_VACCINES: readonly PetVaccine[] = [
  { id: 'fvrcp', name: 'FVRCP (Tricat)', detail: 'Flu and panleukopenia · yearly', price: 850 },
  { id: 'cat-rabies', name: 'Anti-rabies', detail: 'Yearly', price: 450 },
  { id: 'felv', name: 'FeLV', detail: 'Feline leukaemia · outdoor cats', price: 1400 },
];

export const DOG_BREEDS = [
  'Labrador Retriever',
  'Golden Retriever',
  'German Shepherd',
  'Beagle',
  'Shih Tzu',
  'Pug',
  'Indie',
  'Husky',
  'Rottweiler',
] as const;

export const CAT_BREEDS = [
  'Indian Domestic',
  'Persian',
  'Siamese',
  'Maine Coon',
  'British Shorthair',
  'Bengal',
] as const;

/** `labrador-retriever` — a row id from a breed name. */
export const slugOf = (name: string): string => name.toLowerCase().replaceAll(' ', '-');

/**
 * Lumio Home's brand details, installation services and the helpers that look up a
 * category or turn a product into a carousel card (the products live in `products.ts`).
 * Fictional names, numbers and `.example` links.
 */
import type { Product } from '../../schema';
import type { IconKey } from '../../visuals';
import { CATEGORIES, type Category, type Item } from './products';

export const BRAND = {
  name: 'Lumio Experience Centre, Indiranagar',
  phone: '+91 80 4920 6600',
  carePhone: '+91 80 4920 6611',
  email: 'care@lumiohome.example',
  address: '12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
  lat: 12.9719,
  lng: 77.6412,
  website: 'https://lumiohome.example',
  track: 'https://lumiohome.example/track',
  setup: 'https://lumiohome.example/setup-videos',
  careAgent: 'Tara (Lumio Care)',
  expertAgent: 'Vikram (Lumio Home Expert)',
  bizAgent: 'Neha (Lumio for Business)',
} as const;

/** Services the technicians install, with the visit fee. */
export const INSTALLS = [
  {
    id: 'doorbell',
    title: 'Video doorbell',
    description: 'Wiring, chime and app pairing',
    fee: 'Free',
  },
  {
    id: 'lock',
    title: 'Smart lock',
    description: 'Door fitting, fingerprints and PINs',
    fee: 'Free',
  },
  {
    id: 'cameras',
    title: 'Cameras (up to 4)',
    description: 'Mounting, Wi-Fi check, alert zones',
    fee: '₹499',
  },
  {
    id: 'panel',
    title: 'Ceiling panel',
    description: 'Electrical fitting and scenes',
    fee: '₹299',
  },
  {
    id: 'soundbar',
    title: 'Soundbar wall-mount',
    description: 'Bracket, TV pairing, calibration',
    fee: '₹399',
  },
] as const;

export function categoryOf(id: string): Category {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown Lumio category: ${id}`);
  }
  return found;
}

/** A product as a carousel card whose button stores it in `p*` variables for checkout. */
export function itemCard(item: Item, icon: IconKey, buttonTitle: string): Product {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    price: item.price,
    mrp: item.mrp,
    badge: item.badge,
    image: { icon, accent: 'teal', title: item.title },
    buttonTitle,
    set: {
      pId: item.id,
      pName: item.title,
      pSub: item.subtitle,
      pPrice: String(item.price),
      pMrp: String(item.mrp),
      pRating: item.rating,
    },
  };
}

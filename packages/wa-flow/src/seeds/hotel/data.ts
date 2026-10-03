/**
 * Coral Bay Resort's dummy data: the resort, room types with nightly rates, stay lengths
 * priced per room (GST slab and prepaid saving worked out here, because a template cannot
 * multiply), guest mixes, airport transfers, in-room dining and late checkout.
 * Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const HOTEL = {
  name: 'Coral Bay Resort, Candolim',
  phone: '+91 832 248 9000',
  address: 'Fort Aguada Road, Candolim, Bardez, North Goa 403515',
  lat: 15.5167,
  lng: 73.7626,
  website: 'https://coralbay.example',
  webCheckIn: 'https://coralbay.example/web-check-in',
  directions: 'https://maps.coralbay.example/candolim',
  review: 'https://reviews.coralbay.example/candolim',
} as const;

export const FRONT_DESK = {
  agentName: 'Elton (Coral Bay front desk)',
  name: 'Elton Fernandes',
  phone: '+91 98220 45100',
  role: 'Front office, Coral Bay Resort',
} as const;

export const DUTY_MANAGER = {
  agentName: 'Priya Naik (Duty manager)',
  name: 'Priya Naik',
  phone: '+91 98220 45111',
  role: 'Duty manager, Coral Bay Resort',
} as const;

export const DRIVER = {
  name: 'Santosh Gaonkar',
  phone: '+91 98220 45177',
  role: 'Chauffeur · white Innova Crysta, GA-03-K-4410',
} as const;

export interface Room {
  key: string;
  name: string;
  summary: string;
  /** Rupees per night, before GST. */
  rate: number;
  mrp: number;
  sleeps: string;
  size: string;
  badge?: string;
  icon: IconKey;
}

export const ROOMS: readonly Room[] = [
  {
    key: 'garden',
    name: 'Garden Deluxe',
    summary: 'King bed, garden balcony, rain shower',
    rate: 5800,
    mrp: 7200,
    sleeps: '2 adults + 1 child',
    size: '32 m²',
    icon: 'bed',
  },
  {
    key: 'seaview',
    name: 'Sea-view Premier',
    summary: 'Arabian Sea view, bathtub, sit-out',
    rate: 8200,
    mrp: 9900,
    sleeps: '2 adults + 1 child',
    size: '38 m²',
    badge: 'Most booked',
    icon: 'hotel',
  },
  {
    key: 'pool',
    name: 'Pool-access Suite',
    summary: 'Step from your terrace into the lagoon pool',
    rate: 11500,
    mrp: 13800,
    sleeps: '2 adults + 2 children',
    size: '52 m²',
    badge: 'Honeymoon pick',
    icon: 'water',
  },
  {
    key: 'villa',
    name: 'Family Villa',
    summary: 'Two bedrooms, living room and a private garden',
    rate: 14900,
    mrp: 17500,
    sleeps: '4 adults + 2 children',
    size: '96 m²',
    icon: 'home',
  },
];

/** What choosing a room stores for the rest of the booking. */
export const roomSet = (room: Room) => ({
  room: room.name,
  roomKey: room.key,
  rate: String(room.rate),
});

export const NIGHTS = [1, 2, 3, 4, 5, 7] as const;

/** India's hotel GST: 12% up to ₹7,500 a night, 18% above. */
const gstRate = (rate: number) => (rate > 7500 ? 0.18 : 0.12);
const PREPAID_OFF = 0.1;

/** What one stay length of a room costs, ready for a list row's `set`. */
export function stayPrice(room: Room, nights: number) {
  const roomTotal = room.rate * nights;
  const save = Math.round(roomTotal * PREPAID_OFF);
  const gst = Math.round((roomTotal - save) * gstRate(room.rate));
  return { roomTotal, save, gst, gstLabel: `GST (${gstRate(room.rate) * 100}%)` };
}

export const GUEST_MIX = [
  { id: 'g1', title: '1 adult', guests: '1 adult' },
  { id: 'g2', title: '2 adults', guests: '2 adults' },
  { id: 'g21', title: '2 adults, 1 child', guests: '2 adults, 1 child' },
  { id: 'g22', title: '2 adults, 2 children', guests: '2 adults, 2 children' },
  { id: 'g3', title: '3 adults', guests: '3 adults' },
  { id: 'g4', title: '4 adults', guests: '4 adults' },
  { id: 'g6', title: '4 adults, 2 children', guests: '4 adults, 2 children' },
] as const;

export const AIRPORTS = [
  { id: 'goi', title: 'Dabolim (GOI)', fare: 1800, eta: '55 minutes' },
  { id: 'gox', title: 'Mopa (GOX)', fare: 2600, eta: '50 minutes' },
] as const;

export const ARRIVAL_WINDOWS = [
  {
    id: 'early',
    title: 'Before 12 pm',
    description: 'Early check-in ₹1,500, subject to availability',
  },
  { id: 'noon', title: '12 pm – 2 pm', description: 'Lounge and pool while we ready the room' },
  { id: 'afternoon', title: '2 pm – 6 pm', description: 'Standard check-in from 2 pm' },
  { id: 'evening', title: '6 pm – 10 pm', description: 'Welcome drink at the beach bar' },
  { id: 'late', title: 'After 10 pm', description: 'Night manager will be waiting' },
] as const;

export interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  icon: IconKey;
}

export const IN_ROOM_DINING: readonly MenuItem[] = [
  {
    id: 'fish-thali',
    title: 'Goan fish thali',
    subtitle: 'Kingfish curry, rava fry, rice, sol kadhi',
    price: 950,
    icon: 'food',
  },
  {
    id: 'xacuti',
    title: 'Chicken xacuti',
    subtitle: 'With poi bread or rice',
    price: 780,
    icon: 'food',
  },
  {
    id: 'veg-thali',
    title: 'Veg thali',
    subtitle: 'Dal, two sabzis, rice, rotis, dessert',
    price: 650,
    icon: 'restaurant',
  },
  { id: 'club', title: 'Club sandwich', subtitle: 'Fries and coleslaw', price: 520, icon: 'food' },
  {
    id: 'bebinca',
    title: 'Bebinca with ice cream',
    subtitle: 'Classic Goan layered dessert',
    price: 380,
    icon: 'coffee',
  },
];

export const LATE_CHECKOUT = [
  { id: 'one', title: 'Until 1 pm', fee: 0 },
  { id: 'three', title: 'Until 3 pm', fee: 1500 },
  { id: 'six', title: 'Until 6 pm', fee: 3000 },
] as const;

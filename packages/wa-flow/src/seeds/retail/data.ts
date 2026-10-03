/**
 * Bazaarly's dummy catalogue: the store itself, its categories and products, the customer's
 * recent orders (for tracking and returns), return reasons and the pending COD order.
 * Fictional names, numbers and `.example` links.
 */
import type { IconKey } from '../../visuals';

export const STORE = {
  name: 'Bazaarly Experience Store, Koramangala',
  phone: '+91 80 4110 7700',
  address: '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034',
  lat: 12.9345,
  lng: 77.6268,
  website: 'https://bazaarly.example',
  trackUrl: 'https://track.bazaarly.example',
  returnsPolicy: 'https://bazaarly.example/returns-policy',
  sizeGuide: 'https://bazaarly.example/size-guide',
} as const;

/** The customer-care lead every escalation is handed to. */
export const CARE_AGENT = {
  agentName: 'Nisha (Bazaarly Care)',
  stylistName: 'Kabir (Bazaarly Stylist)',
} as const;

export const DELIVERY_PARTNER = {
  name: 'Sandeep Yadav',
  phone: '+91 98861 40217',
  role: 'Delivery partner',
  organisation: 'Bazaarly Express',
} as const;

/** Cash-on-delivery handling fee, waived when the customer switches to prepaid. */
export const COD_FEE = 49;

export interface Item {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  mrp: number;
  badge?: string;
  icon: IconKey;
  /** `yes` when the customer must pick a size before buying. */
  sized: 'yes' | 'no';
  /** Variant shown on the order, e.g. a colour or capacity. */
  variant: string;
  rating: string;
}

export interface Category {
  key: string;
  name: string;
  description: string;
  icon: IconKey;
  items: readonly Item[];
}

export const CATEGORIES: readonly Category[] = [
  {
    key: 'fashion',
    name: 'Fashion',
    description: 'Kurtas, shirts, sneakers and festive wear',
    icon: 'shirt',
    items: [
      {
        id: 'kurta-indigo',
        title: 'Indigo Block-Print Kurta',
        subtitle: 'Pure cotton · straight fit · hand block print',
        price: 1299,
        mrp: 2199,
        badge: 'Bestseller',
        icon: 'shirt',
        sized: 'yes',
        variant: 'Indigo',
        rating: '4.5 ★ (2,140)',
      },
      {
        id: 'linen-shirt',
        title: 'Relaxed Linen Shirt',
        subtitle: 'Linen-cotton blend · breathable · 5 colours',
        price: 1499,
        mrp: 2499,
        badge: 'New arrival',
        icon: 'shirt',
        sized: 'yes',
        variant: 'Sage green',
        rating: '4.3 ★ (860)',
      },
      {
        id: 'white-sneakers',
        title: 'Classic White Sneakers',
        subtitle: 'Cushioned sole · vegan leather · UK 6–11',
        price: 1999,
        mrp: 3299,
        icon: 'sports',
        sized: 'yes',
        variant: 'White',
        rating: '4.4 ★ (3,015)',
      },
      {
        id: 'silk-saree',
        title: 'Banarasi Art-Silk Saree',
        subtitle: 'Zari border · with unstitched blouse piece',
        price: 2899,
        mrp: 4999,
        badge: 'Festive pick',
        icon: 'gift',
        sized: 'no',
        variant: 'Maroon & gold',
        rating: '4.6 ★ (1,204)',
      },
    ],
  },
  {
    key: 'electronics',
    name: 'Electronics',
    description: 'Earbuds, smartwatches, chargers and speakers',
    icon: 'laptop',
    items: [
      {
        id: 'earbuds',
        title: 'Bazaarly Pods ANC',
        subtitle: 'Noise cancelling · 40 h battery · IPX5',
        price: 2499,
        mrp: 4999,
        badge: 'Save 50%',
        icon: 'music',
        sized: 'no',
        variant: 'Midnight black',
        rating: '4.2 ★ (5,620)',
      },
      {
        id: 'smartwatch',
        title: 'Pulse Smartwatch 2',
        subtitle: '1.9" AMOLED · SpO2 · Bluetooth calling',
        price: 3299,
        mrp: 5999,
        icon: 'clock',
        sized: 'no',
        variant: 'Graphite',
        rating: '4.1 ★ (2,388)',
      },
      {
        id: 'power-bank',
        title: '20000 mAh Power Bank',
        subtitle: '22.5 W fast charge · USB-C in/out',
        price: 1399,
        mrp: 2199,
        icon: 'electricity',
        sized: 'no',
        variant: 'Blue',
        rating: '4.4 ★ (7,910)',
      },
      {
        id: 'speaker',
        title: 'Boom Mini Speaker',
        subtitle: '10 W · 12 h playback · splash-proof',
        price: 1799,
        mrp: 2999,
        badge: 'Top rated',
        icon: 'music',
        sized: 'no',
        variant: 'Teal',
        rating: '4.5 ★ (1,476)',
      },
    ],
  },
  {
    key: 'home',
    name: 'Home & Kitchen',
    description: 'Cookware, bedsheets, storage and décor',
    icon: 'home',
    items: [
      {
        id: 'cookware',
        title: 'Tri-Ply Cookware Set',
        subtitle: '3 pieces · induction-ready · 5-year warranty',
        price: 3499,
        mrp: 5800,
        badge: 'Bestseller',
        icon: 'food',
        sized: 'no',
        variant: 'Steel',
        rating: '4.6 ★ (980)',
      },
      {
        id: 'bedsheet',
        title: 'Cotton King Bedsheet',
        subtitle: '210 TC · 2 pillow covers · Jaipur print',
        price: 999,
        mrp: 1799,
        icon: 'bed',
        sized: 'no',
        variant: 'Mustard floral',
        rating: '4.3 ★ (4,102)',
      },
      {
        id: 'containers',
        title: 'Airtight Containers (12)',
        subtitle: 'BPA-free · stackable · 300 ml to 1.5 l',
        price: 799,
        mrp: 1299,
        icon: 'grocery',
        sized: 'no',
        variant: 'Clear',
        rating: '4.4 ★ (6,233)',
      },
      {
        id: 'lamp',
        title: 'Rattan Table Lamp',
        subtitle: 'Handwoven shade · warm LED bulb included',
        price: 1599,
        mrp: 2599,
        badge: 'New arrival',
        icon: 'electricity',
        sized: 'no',
        variant: 'Natural',
        rating: '4.5 ★ (312)',
      },
    ],
  },
  {
    key: 'beauty',
    name: 'Beauty & Care',
    description: 'Skincare, haircare and grooming kits',
    icon: 'beauty',
    items: [
      {
        id: 'serum',
        title: 'Vitamin C Face Serum',
        subtitle: '30 ml · 10% vitamin C · for all skin types',
        price: 549,
        mrp: 899,
        badge: 'Save 39%',
        icon: 'beauty',
        sized: 'no',
        variant: '30 ml',
        rating: '4.3 ★ (8,450)',
      },
      {
        id: 'hair-oil',
        title: 'Onion & Bhringraj Hair Oil',
        subtitle: '200 ml · cold-pressed · no mineral oil',
        price: 399,
        mrp: 599,
        icon: 'plant',
        sized: 'no',
        variant: '200 ml',
        rating: '4.2 ★ (5,190)',
      },
      {
        id: 'trimmer',
        title: 'Cordless Beard Trimmer',
        subtitle: '40 length settings · 90 min runtime',
        price: 1299,
        mrp: 2199,
        badge: 'Top rated',
        icon: 'tools',
        sized: 'no',
        variant: 'Black',
        rating: '4.4 ★ (3,760)',
      },
      {
        id: 'gift-box',
        title: 'Self-Care Gift Box',
        subtitle: 'Face wash, serum, lip balm and a tote',
        price: 1199,
        mrp: 1999,
        icon: 'gift',
        sized: 'no',
        variant: 'Gift wrapped',
        rating: '4.6 ★ (640)',
      },
    ],
  },
];

export interface Size {
  id: string;
  title: string;
  description: string;
}

export const SIZES: readonly Size[] = [
  { id: 'size-s', title: 'S', description: 'Chest 38 in · UK 6 shoe' },
  { id: 'size-m', title: 'M', description: 'Chest 40 in · UK 7–8 shoe' },
  { id: 'size-l', title: 'L', description: 'Chest 42 in · UK 9 shoe' },
  { id: 'size-xl', title: 'XL', description: 'Chest 44 in · UK 10 shoe' },
  { id: 'size-xxl', title: 'XXL', description: 'Chest 46 in · UK 11 shoe' },
];

/** `shipped` → in transit, `ofd` → out for delivery today, `delivered` → delivered. */
export type OrderStatus = 'shipped' | 'ofd' | 'delivered';

export interface PastOrder {
  id: string;
  orderNo: string;
  item: string;
  price: number;
  status: OrderStatus;
  placed: string;
  courier: string;
  awb: string;
  payment: 'Prepaid' | 'Cash on delivery';
}

export const RECENT_ORDERS: readonly PastOrder[] = [
  {
    id: 'o-earbuds',
    orderNo: 'BZ-58210473',
    item: 'Bazaarly Pods ANC',
    price: 2499,
    status: 'shipped',
    placed: 'Placed 2 days ago',
    courier: 'Bazaarly Express',
    awb: 'BXP7742190356',
    payment: 'Prepaid',
  },
  {
    id: 'o-cookware',
    orderNo: 'BZ-58197722',
    item: 'Tri-Ply Cookware Set',
    price: 3499,
    status: 'ofd',
    placed: 'Placed 4 days ago',
    courier: 'Bazaarly Express',
    awb: 'BXP7741865210',
    payment: 'Cash on delivery',
  },
  {
    id: 'o-kurta',
    orderNo: 'BZ-58150391',
    item: 'Indigo Block-Print Kurta',
    price: 1299,
    status: 'delivered',
    placed: 'Delivered 3 days ago',
    courier: 'BlueLine Couriers',
    awb: 'BLC220981774',
    payment: 'Prepaid',
  },
];

export interface ReturnableItem {
  id: string;
  orderNo: string;
  item: string;
  price: number;
  delivered: string;
  /** `yes` when the item can be swapped for another size. */
  sized: 'yes' | 'no';
  payment: 'Prepaid' | 'Cash on delivery';
  /** `yes` when the 7-day return window has closed. */
  expired: 'yes' | 'no';
}

export const RETURNABLE: readonly ReturnableItem[] = [
  {
    id: 'r-kurta',
    orderNo: 'BZ-58150391',
    item: 'Indigo Block-Print Kurta (M)',
    price: 1299,
    delivered: 'Delivered 3 days ago',
    sized: 'yes',
    payment: 'Prepaid',
    expired: 'no',
  },
  {
    id: 'r-sneakers',
    orderNo: 'BZ-58133018',
    item: 'Classic White Sneakers (UK 8)',
    price: 1999,
    delivered: 'Delivered 5 days ago',
    sized: 'yes',
    payment: 'Cash on delivery',
    expired: 'no',
  },
  {
    id: 'r-bedsheet',
    orderNo: 'BZ-58120964',
    item: 'Cotton King Bedsheet',
    price: 999,
    delivered: 'Delivered 6 days ago',
    sized: 'no',
    payment: 'Cash on delivery',
    expired: 'no',
  },
  {
    id: 'r-speaker',
    orderNo: 'BZ-58011257',
    item: 'Boom Mini Speaker',
    price: 1799,
    delivered: 'Delivered 19 days ago',
    sized: 'no',
    payment: 'Prepaid',
    expired: 'yes',
  },
];

export interface Reason {
  id: string;
  title: string;
  description: string;
  /** `yes` when the reason needs a short description for quality checks. */
  detail: 'yes' | 'no';
}

export const RETURN_REASONS: readonly Reason[] = [
  {
    id: 'size',
    title: 'Size or fit issue',
    description: 'Too tight, too loose or the wrong length',
    detail: 'no',
  },
  {
    id: 'damaged',
    title: 'Damaged or defective',
    description: 'Torn, broken, stained or not working',
    detail: 'yes',
  },
  {
    id: 'wrong',
    title: 'Wrong item received',
    description: 'Different product, colour or size',
    detail: 'yes',
  },
  {
    id: 'different',
    title: 'Not as described',
    description: 'Colour, material or features differ from the listing',
    detail: 'yes',
  },
  {
    id: 'changed-mind',
    title: 'Changed my mind',
    description: 'No longer needed or found a better option',
    detail: 'no',
  },
];

/** The cash-on-delivery order the confirmation journey asks about. */
export const COD_ORDER = {
  orderNo: 'BZ-58224815',
  items: [
    { id: 'linen-shirt', name: 'Relaxed Linen Shirt (L, Sage green)', qty: 1, price: 1499 },
    { id: 'serum', name: 'Vitamin C Face Serum (30 ml)', qty: 2, price: 549 },
  ],
  delivery: 0,
  address: 'Flat 304, Sai Residency, 6th Cross, HSR Layout, Bengaluru 560102',
  /** Total to pay in cash, COD fee included: 1499 + 2 × 549 + 49. */
  total: 2646,
  /** Total when paid online now (COD fee waived, 5% prepaid discount). */
  prepaidDiscount: 130,
  prepaidTotal: 2467,
} as const;

export const CANCEL_REASONS = [
  { id: 'by-mistake', title: 'Ordered by mistake', description: 'I did not mean to place it' },
  { id: 'cheaper', title: 'Found it cheaper', description: 'Better price elsewhere' },
  { id: 'late', title: 'Delivery too late', description: 'I need it sooner than the ETA' },
  { id: 'cash', title: 'No cash at hand', description: 'Will order again later' },
  { id: 'other', title: 'Something else', description: 'Another reason' },
] as const;

/** `₹1,299` — for row descriptions, which are plain text. */
export const rupees = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

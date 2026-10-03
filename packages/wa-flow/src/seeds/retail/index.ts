/**
 * Bazaarly — an online store for fashion, electronics, home and beauty. Four workflows:
 * product enquiry and checkout, order tracking, returns and exchanges, and COD confirmation.
 */
import { defineDemo } from '../../author';
import { codConfirm } from './cod-confirm';
import { STORE } from './data';
import { returns } from './returns';
import { shop } from './shop';
import { trackOrder } from './track-order';

export const retail = defineDemo({
  key: 'retail',
  industry: 'Retail / E-commerce',
  business: {
    name: 'Bazaarly',
    tagline: 'Shop, track, return and pay on delivery — on WhatsApp',
    category: 'Shopping',
    about:
      'Fashion, electronics, home and beauty, delivered across India in 2–4 days. Browse the catalogue, track orders, return or exchange in 7 days and confirm cash-on-delivery orders, right here.',
    icon: 'store',
    accent: 'orange',
    verified: true,
    phone: STORE.phone,
    email: 'care@bazaarly.example',
    website: STORE.website,
    address: STORE.address,
    hours: 'Chat 24×7 · Care team 9 am – 9 pm, all days',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to Bazaarly.',
  menuText: 'What would you like to do today? Pick an option below, or just type what you need.',
  menuButton: 'View options',
  workflows: [shop, trackOrder, returns, codConfirm],
});

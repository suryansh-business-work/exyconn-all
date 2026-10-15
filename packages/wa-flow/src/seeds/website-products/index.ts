/**
 * Lumio Home — a direct-to-consumer smart home and electronics brand, with the chat agent on
 * its online store (`channel: 'website'`). Nine workflows: product finder, catalogue, offers,
 * order tracking, returns, installation, warranty, comparisons and talk to a human.
 */
import { defineDemo } from '../../author';
import { catalogue } from './catalogue';
import { compare } from './compare';
import { BRAND } from './data';
import { finder } from './finder';
import { human } from './human';
import { install } from './install';
import { offers } from './offers';
import { returns } from './returns';
import { track } from './track';
import { warranty } from './warranty';

export const websiteProducts = defineDemo({
  key: 'website-products',
  channel: 'website',
  industry: 'Online store',
  business: {
    name: 'Lumio Home',
    tagline: 'Smart home and electronics, delivered and installed',
    category: 'Online store',
    about:
      'Smart cameras, lighting, audio and air purifiers that work together in one app. Free express delivery, 7-day returns, a 1-year warranty and installation by certified technicians.',
    icon: 'home',
    accent: 'teal',
    verified: true,
    phone: BRAND.phone,
    email: BRAND.email,
    website: BRAND.website,
    address: BRAND.address,
    hours: 'Chat 24×7 · Care team 9 am – 9 pm IST, every day',
  },
  greeting: 'Hi {{user.firstName}} 👋 I am Lumi, your Lumio Home shopping assistant.',
  menuText:
    'I can find the right product, apply offers, track an order or book an installation. What can I do for you?',
  menuButton: 'How can I help?',
  workflows: [finder, catalogue, offers, track, returns, install, warranty, compare, human],
});

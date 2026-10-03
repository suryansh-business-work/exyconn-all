/**
 * Lexora Legal Associates — a full-service law firm. Four workflows: consultation booking,
 * case categories (free text sorted by `ai`), document collection and case follow-up.
 */
import { defineDemo } from '../../author';
import { caseCategory } from './case-category';
import { consultation } from './consultation';
import { FIRM } from './data';
import { documentCollection } from './document-collection';
import { followUp } from './follow-up';

export const legal = defineDemo({
  key: 'legal',
  industry: 'Legal Services',
  business: {
    name: 'Lexora Legal Associates',
    tagline: 'Consultations, documents and case updates on WhatsApp',
    category: 'Law firm',
    about:
      'A full-service law firm with teams for property, family, criminal, corporate, consumer and employment matters. Book a consultation, share documents securely and follow your case right here.',
    icon: 'legal',
    accent: 'indigo',
    verified: true,
    phone: FIRM.phone,
    email: 'clients@lexora.example',
    website: FIRM.website,
    address: FIRM.address,
    hours: 'Mon–Sat, 10 am – 6 pm · urgent criminal matters 24×7',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to Lexora Legal Associates.',
  menuText:
    'How can we help you today? Pick an option below, or describe your matter in your own words.',
  menuButton: 'View options',
  workflows: [consultation, caseCategory, documentCollection, followUp],
});

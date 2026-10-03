/**
 * BrightPath Academy — free demo classes, counselling read from free text, admissions with a
 * brochure, application and scholarship test, and fee reminders with receipts and EMI help.
 */
import { defineDemo } from '../../author';
import { admission } from './admission';
import { counselling } from './counselling';
import { ACADEMY } from './data';
import { demo } from './demo';
import { fees } from './fees';

export const education = defineDemo({
  key: 'education',
  industry: 'Education',
  business: {
    name: 'BrightPath Academy',
    tagline: 'Demo classes, counselling, admissions and fees on WhatsApp',
    category: 'Coaching institute',
    about:
      'Coaching for JEE, NEET, MHT-CET and school foundation, plus coding and spoken English, online and at our Pune centre. Book a demo, talk to a counsellor, apply and pay fees right here.',
    icon: 'school',
    accent: 'indigo',
    verified: true,
    phone: ACADEMY.phone,
    email: 'admissions@brightpath.example',
    website: ACADEMY.website,
    address: ACADEMY.address,
    hours: 'Mon–Sat, 9 am – 8 pm',
  },
  greeting: 'Hi {{user.firstName}} 📚 Welcome to BrightPath Academy.',
  menuText: 'How can we help the student today? Pick an option, or just type your question.',
  menuButton: 'View options',
  workflows: [demo, counselling, admission, fees],
});

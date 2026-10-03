/**
 * CityCare Hospital — the reference industry. Five workflows that between them use every
 * node type: appointments, lab tests, vaccinations, a post-visit check-in and lab reports.
 */
import { defineDemo } from '../../author';
import { appointment } from './appointment';
import { HOSPITAL } from './data';
import { followUp } from './follow-up';
import { labTest } from './lab-test';
import { report } from './report';
import { vaccination } from './vaccination';

export const healthcare = defineDemo({
  key: 'healthcare',
  industry: 'Healthcare',
  business: {
    name: 'CityCare Hospital',
    tagline: 'Appointments, lab tests, vaccines and reports on WhatsApp',
    category: 'Hospital',
    about:
      'A multi-speciality hospital with 24×7 emergency care, a NABL-accredited lab and a dedicated children’s wing. Book doctors, tests and vaccines, and get reports, right here.',
    icon: 'hospital',
    accent: 'teal',
    verified: true,
    phone: HOSPITAL.phone,
    email: 'care@citycare.example',
    website: HOSPITAL.website,
    address: HOSPITAL.address,
    hours: 'Emergency 24×7 · OPD Mon–Sat, 9 am – 5 pm',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to CityCare Hospital.',
  menuText: 'How can we help you today? Pick a service below, or just type what you need.',
  menuButton: 'View services',
  workflows: [appointment, labTest, vaccination, followUp, report],
});

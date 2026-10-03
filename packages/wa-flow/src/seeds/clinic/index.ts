/**
 * Aura Skin & Smile Clinic — a skin, dental and aesthetics clinic (not a hospital): dermatology
 * consultations in clinic or on video, dental visits with pain triage, aesthetic treatment
 * packages, and an aftercare check-in after any procedure.
 */
import { defineDemo } from '../../author';
import { aesthetic } from './aesthetic';
import { aftercare } from './aftercare';
import { CLINIC } from './data';
import { dental } from './dental';
import { skinConsult } from './skin-consult';

export const clinic = defineDemo({
  key: 'clinic',
  industry: 'Beauty & Clinic',
  business: {
    name: 'Aura Skin & Smile Clinic',
    tagline: 'Skin, dental and aesthetic care, booked on WhatsApp',
    category: 'Skin & dental clinic',
    about:
      'Dermatologists, dentists and certified skin therapists under one roof. Book a consultation, a dental visit or a treatment package, and get aftercare from your doctor, right here.',
    icon: 'beauty',
    accent: 'pink',
    verified: true,
    phone: CLINIC.phone,
    email: 'hello@auraclinic.example',
    website: CLINIC.website,
    address: CLINIC.address,
    hours: 'Mon–Sat, 10 am – 8 pm · Urgent dental line 24×7',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to Aura Skin & Smile Clinic.',
  menuText: 'What can we do for you today? Pick an option below, or just type what you need.',
  menuButton: 'View options',
  workflows: [skinConsult, dental, aesthetic, aftercare],
});

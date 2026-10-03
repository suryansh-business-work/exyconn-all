/**
 * PawPal Pet Clinic & Spa — a vet clinic with a grooming spa and a mobile spa van. Four
 * workflows: vet appointments, grooming, vaccination reminders and a pet profile.
 */
import { defineDemo } from '../../author';
import { CLINIC } from './data';
import { grooming } from './grooming';
import { petProfile } from './pet-profile';
import { vaccination } from './vaccination';
import { vetAppointment } from './vet-appointment';

export const petCare = defineDemo({
  key: 'pet-care',
  industry: 'Pet Care',
  business: {
    name: 'PawPal Pet Clinic & Spa',
    tagline: 'Vets, grooming and vaccine reminders on WhatsApp',
    category: 'Veterinary clinic',
    about:
      'A full-service vet clinic with 24×7 emergency care, a grooming spa and a mobile spa van. Book visits, grooms and vaccines, and keep your pet’s records, right here.',
    icon: 'pet',
    accent: 'orange',
    verified: true,
    phone: CLINIC.phone,
    email: 'hello@pawpal.example',
    website: CLINIC.website,
    address: CLINIC.address,
    hours: 'Clinic 9 am – 9 pm daily · Emergency 24×7',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to PawPal Pet Clinic & Spa.',
  menuText:
    'How can we help you and your pet today? Pick an option below, or just type what you need.',
  menuButton: 'View services',
  workflows: [vetAppointment, grooming, vaccination, petProfile],
});

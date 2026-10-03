/**
 * FitNation — a gym chain with five branches across Mumbai. Four workflows: a free gym trial,
 * personal training, yoga classes, and membership renewal (with plans, add-ons and freezes).
 */
import { defineDemo } from '../../author';
import { GYM } from './data';
import { gymTrial } from './gym-trial';
import { membershipRenewal } from './membership-renewal';
import { personalTraining } from './personal-training';
import { yoga } from './yoga';

export const fitness = defineDemo({
  key: 'fitness',
  industry: 'Fitness',
  business: {
    name: 'FitNation',
    tagline: 'Trials, coaching, yoga and memberships on WhatsApp',
    category: 'Gym & fitness studio',
    about:
      'A gym chain with five branches across Mumbai: strength floors, group classes, a yoga studio and certified personal trainers. Try a day free, book classes and manage your membership right here.',
    icon: 'fitness',
    accent: 'red',
    verified: true,
    phone: GYM.phone,
    email: 'hello@fitnation.example',
    website: GYM.website,
    address: GYM.address,
    hours: 'Mon–Sat 5 am – 11 pm · Sun 7 am – 1 pm',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to FitNation.',
  menuText: 'What would you like to do today? Pick an option below, or just type what you need.',
  menuButton: 'View options',
  workflows: [gymTrial, personalTraining, yoga, membershipRenewal],
});

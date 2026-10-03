/**
 * Loftline Workspaces — coworking in five centres. Four workflows: workspace tours, meeting
 * room booking (with natural-language times), day passes and membership enquiries.
 */
import { defineDemo } from '../../author';
import { BRAND } from './data';
import { dayPass } from './day-pass';
import { meetingRoom } from './meeting-room';
import { membership } from './membership';
import { tour } from './tour';

export const coworking = defineDemo({
  key: 'coworking',
  industry: 'Coworking',
  business: {
    name: 'Loftline Workspaces',
    tagline: 'Tours, meeting rooms and day passes on WhatsApp',
    category: 'Coworking space',
    about:
      'Flexible workspaces in Bengaluru, Pune, Gurugram and Hyderabad — hot desks, dedicated desks, private cabins and meeting rooms, with fast Wi-Fi and unlimited coffee.',
    icon: 'business',
    accent: 'amber',
    verified: true,
    phone: BRAND.phone,
    email: 'hello@loftline.example',
    website: BRAND.website,
    address: BRAND.address,
    hours: 'Centres 24×7 for members · Front desk 9 am – 9 pm',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to Loftline Workspaces.',
  menuText: 'What can we set up for you? Pick an option below, or just type what you need.',
  menuButton: 'View options',
  workflows: [tour, meetingRoom, dayPass, membership],
});

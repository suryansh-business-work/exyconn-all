/**
 * AutoNova Motors — a car dealership with its own workshop. Four workflows: service booking,
 * doorstep pickup, live service status with approvals, and test drives.
 */
import { defineDemo } from '../../author';
import { DEALER } from './data';
import { pickup } from './pickup';
import { serviceBooking } from './service-booking';
import { serviceStatus } from './service-status';
import { testDrive } from './test-drive';

export const automobile = defineDemo({
  key: 'automobile',
  industry: 'Automobile',
  business: {
    name: 'AutoNova Motors',
    tagline: 'Service, pickup, job status and test drives on WhatsApp',
    category: 'Car dealership',
    about:
      'An authorised car dealership and multi-bay workshop with genuine parts, doorstep pickup and drop, and home test drives. Book, track and approve work right here.',
    icon: 'car',
    accent: 'blue',
    verified: true,
    phone: DEALER.phone,
    email: 'care@autonova.example',
    website: DEALER.website,
    address: DEALER.address,
    hours: 'Showroom 10 am – 8 pm daily · Workshop Mon–Sat, 8 am – 7 pm',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to AutoNova Motors.',
  menuText:
    'How can we help with your car today? Pick an option below, or just type what you need.',
  menuButton: 'View options',
  workflows: [serviceBooking, pickup, serviceStatus, testDrive],
});

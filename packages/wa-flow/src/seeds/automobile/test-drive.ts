/**
 * Test drive: model carousel (or a comparison brochure) → showroom or home → day → slot →
 * licence holder → review → QR pass, calendar, map pin or home note → reminder push → a
 * follow-up push after the drive → on-road price PDF → sales consultant.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { rupees } from '../healthcare/data';
import { CARS, DEALER, SALES_CONSULTANT, type CarModel } from './data';

const WHERE = 'where';
const DAY = 'day';
const REVIEW = 'review';
const BROCHURE = 'brochure';
const MODELS = 'models';
const SALES = 'sales';

function carCard(car: CarModel): Product {
  return {
    id: car.id,
    title: car.name,
    subtitle: `${car.body} · ${car.fuel} · ${car.mileage}`,
    price: car.price,
    badge: car.badge,
    image: { icon: car.icon, accent: 'blue', title: car.name, subtitle: car.body },
    buttonTitle: 'Book test drive',
    set: { car: car.name, carPrice: String(car.price), carFuel: car.fuel },
  };
}

export const testDrive = defineWorkflow({
  key: 'test-drive',
  name: 'Book a test drive',
  description: 'Drive any model at the showroom or at home',
  keywords: ['test drive', 'new car', 'buy a car', 'demo drive', 'price', 'brochure'],
  nodes: [
    {
      id: MODELS,
      type: 'carousel',
      data: {
        text: 'Which car would you like to drive, {{user.firstName}}? Ex-showroom prices, Pune.',
        cards: [
          ...CARS.map(carCard),
          {
            id: BROCHURE,
            title: 'Compare all models',
            subtitle: 'Prices, mileage and features side by side',
            price: CARS[0].price,
            badge: `From ${rupees(CARS[0].price)}`,
            image: { icon: 'document', accent: 'slate', title: 'Brochure' },
            buttonTitle: 'Get brochure',
          },
        ],
      },
      next: { ...Object.fromEntries(CARS.map((c) => [c.id, WHERE])), [BROCHURE]: BROCHURE },
    },
    {
      id: BROCHURE,
      type: 'document',
      data: {
        document: {
          fileName: 'AutoNova_Range_Brochure.pdf',
          fileType: 'PDF',
          pages: 12,
          sizeKb: 4820,
          preview: {
            title: 'The Nova range',
            subtitle: 'Ex-showroom prices, Pune',
            sections: [
              {
                kind: 'table',
                heading: 'Models',
                columns: ['Model', 'Body', 'Fuel', 'From'],
                rows: CARS.map((c) => ({
                  id: c.id,
                  cells: [c.name, c.body, c.fuel, rupees(c.price)],
                })),
              },
              {
                kind: 'text',
                heading: 'Every Nova comes with',
                text: '6 airbags, ABS with EBD, a 3-year / 1 lakh km warranty, 24×7 roadside assistance and the first two services free.',
              },
            ],
            footer: 'Prices are indicative and may change without notice.',
          },
        },
        caption: 'Here is the full range. Which one would you like to try?',
      },
      next: 'brochure-next',
    },
    {
      id: 'brochure-next',
      type: 'buttons',
      data: {
        text: 'What next?',
        buttons: [
          { id: 'drive', title: 'Book test drive' },
          { id: 'sales', title: 'Talk to sales' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { drive: MODELS, sales: SALES, menu: 'menu-end' },
    },
    {
      id: WHERE,
      type: 'buttons',
      data: {
        text: 'Where would you like to drive the *{{car}}*?',
        footer: 'Home test drives within 15 km of Baner',
        buttons: [
          {
            id: 'showroom',
            title: 'At the showroom',
            set: { place: 'showroom', placeLabel: 'AutoNova showroom, Baner' },
          },
          { id: 'home', title: 'At my home', set: { place: 'home' } },
        ],
      },
      next: { showroom: DAY, home: 'pincode' },
    },
    {
      id: 'pincode',
      type: 'input',
      data: {
        prompt: 'Your 6-digit PIN code, please, so we can check home test drives there.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'And the address where our consultant should bring the car?',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so our consultant can find you.',
      },
      next: 'addr-ok',
    },
    {
      id: 'addr-ok',
      type: 'text',
      data: {
        set: { placeLabel: '{{address}}' },
        text: 'We drive to {{pincode}}. The {{car}} will come to:\n{{address}}',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you for the {{car}} test drive?',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Free slots on {{dayLabel}} (IST). A drive takes about 30 minutes.',
        button: 'Choose time',
        sections: [
          {
            id: 'more',
            title: 'More options',
            rows: [{ id: 'other-day', title: 'Pick another day' }],
          },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 10,
          to: 19,
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'licence', 'other-day': DAY },
    },
    {
      id: 'licence',
      type: 'buttons',
      data: {
        text: 'Who will drive? The driver needs a valid driving licence — our consultant checks it before handing over the keys.',
        buttons: [
          {
            id: 'me',
            title: 'Me',
            set: { driverName: '{{user.fullName}}', driverPhone: '{{user.phone}}' },
          },
          { id: 'other', title: 'Someone else' },
        ],
      },
      next: { me: 'own-phone', other: 'd-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: {
        note: 'The signed-in profile may have no phone; ask for one then.',
        cases: [{ id: 'missing', var: 'driverPhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: REVIEW },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should our consultant call on the day?',
        var: 'driverPhone',
        kind: 'phone',
      },
      next: REVIEW,
    },
    {
      id: 'd-name',
      type: 'input',
      data: { prompt: "The driver's full name, please.", var: 'driverName', kind: 'name' },
      next: 'd-phone',
    },
    {
      id: 'd-phone',
      type: 'input',
      data: { prompt: "{{driverName}}'s mobile number?", var: 'driverPhone', kind: 'phone' },
      next: REVIEW,
    },
    {
      id: REVIEW,
      type: 'buttons',
      data: {
        header: 'Check your test drive',
        text: '*Car:* {{car}} ({{carFuel}})\n*Driver:* {{driverName}}, {{driverPhone}}\n*Where:* {{placeLabel}}\n*When:* {{dayLabel}} at {{slot|time}}',
        footer: 'Free · no obligation to buy',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'pass', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'pass',
      type: 'ticket',
      data: {
        set: { driveId: '$id:TD' },
        complete: true,
        ticket: {
          ticketId: '{{driveId}}',
          title: 'Test drive booked',
          subtitle: '{{car}} · AutoNova Motors',
          fields: [
            { label: 'Driver', value: '{{driverName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Where', value: '{{placeLabel}}' },
            { label: 'Consultant', value: SALES_CONSULTANT.name },
          ],
          qrData: 'autonova://testdrive/{{driveId}}?slot={{slot}}',
        },
        caption: 'Bring your original driving licence. Show this QR at the showroom desk.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Save the date, or call Sneha, your sales consultant.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Test drive — {{car}}',
              start: '{{slot}}',
              durationMin: 45,
              location: '{{placeLabel}}',
            },
          },
          { kind: 'call', title: 'Call Sneha', phone: SALES_CONSULTANT.phone },
        ],
      },
      next: 'place-check',
    },
    {
      id: 'place-check',
      type: 'condition',
      data: { cases: [{ id: 'home', var: 'place', op: 'eq', value: 'home' }] },
      next: { home: 'home-note', else: 'pin' },
    },
    {
      id: 'home-note',
      type: 'text',
      data: {
        text: 'Sneha will bring a sanitised {{car}} to your door and call 15 minutes before arriving.',
      },
      next: 'remind',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: DEALER.name, address: DEALER.address, lat: DEALER.lat, lng: DEALER.lng },
        caption: 'Visitor parking at the front. Our test-drive route takes in the Baner highway.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Test drive reminder', note: 'Real use: 2 hours before.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'Booked! Enjoy the drive, {{user.firstName}}.', showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Test drive today',
        text: 'Your {{car}} test drive is at {{slot|time}} ({{placeLabel}}). Please carry your driving licence.',
        buttons: [
          { id: 'confirm', title: 'On my way' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'after', reschedule: DAY, cancel: 'r-cancelled' },
    },
    {
      id: 'after',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'How was the drive?', note: 'Real use: after the drive.' },
      next: { next: 'r-ok', later: 'feedback' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'See you soon, {{user.firstName}}.', showMenu: true },
    },
    {
      id: 'r-cancelled',
      type: 'end',
      data: {
        text: 'Your test drive {{driveId}} is cancelled. Book again from the menu any time.',
        showMenu: true,
      },
    },
    {
      id: 'feedback',
      type: 'buttons',
      data: {
        text: 'How did you like the {{car}}, {{user.firstName}}?',
        buttons: [
          { id: 'loved', title: 'Loved it' },
          { id: 'other', title: 'Try another' },
          { id: 'no', title: 'Not for me' },
        ],
      },
      next: { loved: 'onroad', other: MODELS, no: 'no-end' },
    },
    {
      id: 'onroad',
      type: 'document',
      data: {
        set: { quoteId: '$id:QT', insurance: '$price:42000:10' },
        document: {
          fileName: 'AutoNova_OnRoad_Quote.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 96,
          preview: {
            title: 'On-road price quote',
            subtitle: '{{car}} · Pune',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Customer', value: '{{user.fullName}}' },
                  { label: 'Quote', value: '{{quoteId}}' },
                  { label: 'Ex-showroom', value: '{{carPrice|money}}' },
                  { label: 'Insurance (1 year)', value: '{{insurance|money}}' },
                  { label: 'RTO and registration', value: 'About 11% of ex-showroom' },
                  { label: 'Exchange bonus', value: 'Up to ₹40,000' },
                ],
              },
              {
                kind: 'text',
                heading: 'Finance',
                text: 'Loans up to 90% of the on-road price, tenure up to 7 years. Our finance desk compares offers from partner banks for you.',
              },
            ],
            footer: 'Valid for 7 days. Final price at booking.',
          },
        },
        caption: 'Here is your on-road quote for the {{car}}.',
      },
      next: 'onroad-next',
    },
    {
      id: 'onroad-next',
      type: 'buttons',
      data: {
        text: 'Would you like to talk numbers with Sneha?',
        buttons: [
          { id: 'sales', title: 'Talk to sales' },
          { id: 'later', title: 'Maybe later' },
        ],
      },
      next: { sales: SALES, later: 'no-end' },
    },
    {
      id: SALES,
      type: 'handoff',
      data: {
        agentName: SALES_CONSULTANT.agentName,
        text: "Hi {{user.firstName}}, Sneha from AutoNova sales. I can help with variants, colours, exchange value and finance — what's on your mind?",
      },
      next: 'sales-card',
    },
    {
      id: 'sales-card',
      type: 'contact',
      data: {
        contact: {
          name: SALES_CONSULTANT.name,
          phone: SALES_CONSULTANT.phone,
          role: SALES_CONSULTANT.role,
          organisation: 'AutoNova Motors',
        },
      },
      next: 'sales-end',
    },
    {
      id: 'sales-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'no-end',
      type: 'end',
      data: { text: 'Thanks for driving with us, {{user.firstName}}.', showMenu: true },
    },
    {
      id: 'menu-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No test drive was booked. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});

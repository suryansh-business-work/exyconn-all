/**
 * Check-in information: for the stay booked in this chat (or a sample one) — web check-in
 * (arrival window, ID type, last 4 digits → digital room key), a paid airport pickup with the
 * chauffeur's card, timings, directions and the house rules PDF.
 */
import { defineWorkflow } from '../../author';
import { AIRPORTS, ARRIVAL_WINDOWS, DRIVER, HOTEL } from './data';

const OPTIONS = 'options';
const MORE = 'more';

export const checkIn = defineWorkflow({
  key: 'check-in',
  name: 'Check-in and arrival',
  description: 'Web check-in, airport pickup, timings and directions',
  keywords: [
    'check in',
    'check-in',
    'web check in',
    'pickup',
    'airport',
    'checkout time',
    'directions',
  ],
  nodes: [
    {
      id: 'has-booking',
      type: 'condition',
      data: {
        note: 'Reuse the stay booked in this chat; otherwise show a sample one.',
        cases: [{ id: 'none', var: 'bookingId', op: 'empty' }],
      },
      next: { none: 'sample', else: 'intro' },
    },
    {
      id: 'sample',
      type: 'delay',
      data: {
        ms: 400,
        set: {
          bookingId: '$id:CB',
          room: '$pick:Sea-view Premier|Garden Deluxe|Pool-access Suite',
          checkin: '$days:1',
          checkinLabel: '{{checkin|day}}',
          nights: '$int:2:4',
        },
      },
      next: 'intro',
    },
    {
      id: 'intro',
      type: 'text',
      data: {
        text: 'Hi {{user.firstName}}! Your *{{room}}* is booked from {{checkinLabel}} for {{nights}} nights (booking {{bookingId}}).',
      },
      next: OPTIONS,
    },
    {
      id: OPTIONS,
      type: 'list',
      data: {
        text: 'How can we help you get ready?',
        button: 'Options',
        sections: [
          {
            id: 'before',
            title: 'Before you arrive',
            rows: [
              {
                id: 'web',
                title: 'Web check-in',
                description: 'Skip the desk — get a digital key',
              },
              {
                id: 'pickup',
                title: 'Airport pickup',
                description: 'Chauffeur from Dabolim or Mopa',
              },
            ],
          },
          {
            id: 'info',
            title: 'Information',
            rows: [
              {
                id: 'times',
                title: 'Check-in and checkout',
                description: 'Timings, early and late options',
              },
              { id: 'directions', title: 'Directions', description: 'Map pin and parking' },
              {
                id: 'rules',
                title: 'House rules',
                description: 'PDF: ID, pool, guests, quiet hours',
              },
            ],
          },
        ],
      },
      next: {
        web: 'arrival',
        pickup: 'airport',
        times: 'times',
        directions: 'pin',
        rules: 'rules',
      },
    },
    {
      id: 'arrival',
      type: 'list',
      data: {
        text: 'Roughly when will you arrive on {{checkinLabel}}?',
        button: 'Arrival time',
        sections: [
          {
            id: 'windows',
            title: 'Arrival window',
            rows: ARRIVAL_WINDOWS.map((w) => ({ ...w, set: { arrival: w.title } })),
          },
        ],
      },
      next: Object.fromEntries(ARRIVAL_WINDOWS.map((w) => [w.id, 'id-type'])),
    },
    {
      id: 'id-type',
      type: 'buttons',
      data: {
        text: 'Which photo ID will the lead guest show at the desk?',
        footer: 'We only store the last 4 digits',
        buttons: [
          { id: 'aadhaar', title: 'Aadhaar', set: { idType: 'Aadhaar' } },
          { id: 'passport', title: 'Passport', set: { idType: 'Passport' } },
          { id: 'dl', title: 'Driving licence', set: { idType: 'Driving licence' } },
        ],
      },
      next: { aadhaar: 'id-digits', passport: 'id-digits', dl: 'id-digits' },
    },
    {
      id: 'id-digits',
      type: 'input',
      data: {
        prompt: 'Please type the last 4 digits of the {{idType}}.',
        var: 'idLast4',
        kind: 'number',
        error: 'Please type just the last 4 digits, e.g. 4821.',
      },
      next: 'key',
    },
    {
      id: 'key',
      type: 'ticket',
      data: {
        complete: true,
        set: { roomNo: '$int:104:348' },
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Digital room key',
          subtitle: 'Coral Bay Resort · web check-in done',
          fields: [
            { label: 'Guest', value: '{{user.fullName}}' },
            { label: 'Room', value: '{{room}} · {{roomNo}}' },
            { label: 'Arrival', value: '{{checkinLabel}}, {{arrival}}' },
            { label: 'ID', value: '{{idType}} ending {{idLast4}}' },
          ],
          qrData: 'coralbay://key/{{bookingId}}?room={{roomNo}}',
        },
        caption:
          'Tap this QR on the door reader from 2 pm. Please show the original ID at the desk once during your stay.',
      },
      next: MORE,
    },
    {
      id: 'airport',
      type: 'buttons',
      data: {
        text: 'Which airport are you flying into?',
        footer: 'Fixed fare, Innova Crysta, up to 4 guests',
        buttons: AIRPORTS.map((a) => ({
          id: a.id,
          title: a.title,
          set: { airport: a.title, fare: String(a.fare), driveEta: a.eta },
        })),
      },
      next: Object.fromEntries(AIRPORTS.map((a) => [a.id, 'flight'])),
    },
    {
      id: 'flight',
      type: 'input',
      data: {
        prompt: 'Your flight number, e.g. 6E 2135? We track it, so delays are fine.',
        var: 'flight',
        kind: 'text',
        error: 'Please type the flight number, e.g. 6E 2135.',
      },
      next: 'pickup-order',
    },
    {
      id: 'pickup-order',
      type: 'order',
      data: {
        set: { orderId: '$id:CBT' },
        order: {
          orderId: '{{orderId}}',
          title: 'Airport pickup',
          items: [
            { id: 'cab', name: '{{airport}} → Coral Bay · {{flight}}', qty: 1, price: '{{fare}}' },
          ],
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'pickup-paid' },
    },
    {
      id: 'pickup-paid',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Pickup booked',
          items: [
            { id: 'cab', name: '{{airport}} → Coral Bay · {{flight}}', qty: 1, price: '{{fare}}' },
          ],
          status: 'paid',
        },
      },
      next: 'driver-note',
    },
    {
      id: 'driver-note',
      type: 'text',
      data: {
        complete: true,
        text: 'Done! Santosh will wait at arrivals with a "{{user.fullName}}" placard on {{checkinLabel}}. The drive takes about {{driveEta}}.',
      },
      next: 'driver',
    },
    {
      id: 'driver',
      type: 'contact',
      data: {
        contact: {
          name: DRIVER.name,
          phone: DRIVER.phone,
          role: DRIVER.role,
          organisation: 'Coral Bay Resort',
        },
      },
      next: MORE,
    },
    {
      id: 'times',
      type: 'text',
      data: {
        text: '*Check-in:* from 2 pm\n*Checkout:* by 11 am\n*Early check-in:* ₹1,500 from 10 am, subject to availability\n*Late checkout:* free until 1 pm, ₹1,500 until 3 pm\nArrive early? Enjoy the pool and lounge while we prepare your room.',
      },
      next: MORE,
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: HOTEL.name, address: HOTEL.address, lat: HOTEL.lat, lng: HOTEL.lng },
        caption:
          '45 minutes from Dabolim, 50 from Mopa, 20 from Thivim station. Free valet parking.',
      },
      next: 'pin-cta',
    },
    {
      id: 'pin-cta',
      type: 'cta',
      data: {
        text: 'Open the route, or call us if you get lost.',
        actions: [
          { kind: 'url', title: 'Open in Maps', url: HOTEL.directions },
          { kind: 'call', title: 'Call reception', phone: HOTEL.phone },
        ],
      },
      next: MORE,
    },
    {
      id: 'rules',
      type: 'document',
      data: {
        document: {
          fileName: 'CoralBay_House_Rules.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 96,
          preview: {
            title: 'House rules',
            subtitle: 'Coral Bay Resort, Candolim',
            sections: [
              {
                kind: 'fields',
                heading: 'Essentials',
                fields: [
                  { label: 'ID', value: 'Government photo ID for every adult' },
                  { label: 'Visitors', value: 'Lobby and restaurants only, until 10 pm' },
                  { label: 'Pool', value: '7 am – 8 pm; children with an adult' },
                  { label: 'Quiet hours', value: '11 pm – 7 am' },
                  { label: 'Smoking', value: 'Designated areas only' },
                ],
              },
              {
                kind: 'text',
                heading: 'Beach safety',
                text: 'Swim only between the red and yellow flags when lifeguards are on duty (8 am – 6 pm). Sea conditions change quickly during the monsoon.',
              },
            ],
            footer: 'Thank you for helping us keep Coral Bay calm and safe',
          },
        },
        caption: 'Our house rules.',
      },
      next: MORE,
    },
    {
      id: MORE,
      type: 'buttons',
      data: {
        text: 'Anything else before your stay?',
        buttons: [
          { id: 'more', title: 'More options' },
          { id: 'done', title: 'All set' },
        ],
      },
      next: { more: OPTIONS, done: 'done' },
    },
    {
      id: 'done',
      type: 'end',
      data: { text: 'See you on {{checkinLabel}}, {{user.firstName}}!', showMenu: true },
    },
  ],
});

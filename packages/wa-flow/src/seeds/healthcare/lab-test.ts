/**
 * Lab test booking: package carousel or single tests → home collection or a centre → slot →
 * order with fees and discount → paid QR ticket, phlebotomist card and a fasting reminder.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { BLOOD_TESTS, HOSPITAL, LAB_PACKAGES, OTHER_TESTS, rupees, type Bookable } from './data';

const MODE = 'mode';
const SINGLES = 'singles';

/** What picking a test or package stores for the rest of the flow. */
const chosen = (item: Bookable) => ({
  test: item.title,
  testPrice: String(item.price),
  testMrp: String(item.mrp),
  fasting: item.fasting,
  reportEta: item.reportEta,
});

function packageCard(item: Bookable): Product {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    price: item.price,
    mrp: item.mrp,
    badge: item.badge,
    image: { icon: item.icon, accent: 'teal', title: item.title },
    buttonTitle: 'Book package',
    set: chosen(item),
  };
}

function testRow(item: Bookable) {
  return {
    id: item.id,
    title: item.title,
    description: `${item.subtitle} · ${rupees(item.price)}`,
    set: chosen(item),
  };
}

const ALL_TESTS = [...BLOOD_TESTS, ...OTHER_TESTS];

export const labTest = defineWorkflow({
  key: 'lab-test',
  name: 'Book a lab test',
  description: 'Health packages and single tests, home collection',
  keywords: [
    'lab test',
    'blood test',
    'health checkup',
    'health package',
    'sample collection',
    'full body',
  ],
  nodes: [
    {
      id: 'packages',
      type: 'carousel',
      data: {
        text: 'Hi {{user.firstName}}, all tests run in our NABL-accredited lab and we collect at home across the city. Pick a package, or browse single tests.',
        cards: [
          ...LAB_PACKAGES.map(packageCard),
          {
            id: SINGLES,
            title: 'Single tests',
            subtitle: 'CBC, lipid, liver, kidney, thyroid, vitamins and more',
            price: 149,
            badge: 'From ₹149',
            image: { icon: 'search', accent: 'slate', title: 'Single tests' },
            buttonTitle: 'Browse tests',
          },
        ],
      },
      next: { ...Object.fromEntries(LAB_PACKAGES.map((p) => [p.id, MODE])), [SINGLES]: 'single' },
    },
    {
      id: 'single',
      type: 'list',
      data: {
        header: 'Single tests',
        text: 'Choose a test. Prices include the report and a doctor-reviewed summary.',
        button: 'View tests',
        sections: [
          { id: 'blood', title: 'Blood tests', rows: BLOOD_TESTS.map(testRow) },
          { id: 'other', title: 'Urine and others', rows: OTHER_TESTS.map(testRow) },
        ],
      },
      next: Object.fromEntries(ALL_TESTS.map((t) => [t.id, 'test-card'])),
    },
    {
      id: 'test-card',
      type: 'product',
      data: {
        product: {
          id: 'chosen-test',
          title: '{{test}}',
          subtitle: 'Report in {{reportEta}}',
          price: '{{testPrice}}',
          mrp: '{{testMrp}}',
          image: { icon: 'lab', accent: 'teal', title: 'Lab test' },
        },
      },
      next: MODE,
    },
    {
      id: MODE,
      type: 'buttons',
      data: {
        text: '*{{test}}* — {{testPrice|money}}\nHow would you like to give your sample?',
        footer: 'Home collection 6 am – 12 pm, all days',
        buttons: [
          {
            id: 'home',
            title: 'Home collection',
            set: { mode: 'home', collection: 'Home collection', collectionFee: '99' },
          },
          {
            id: 'centre',
            title: 'Visit a centre',
            set: { mode: 'centre', collection: 'At the centre', collectionFee: '0' },
          },
          { id: 'back', title: 'Other tests' },
        ],
      },
      next: { home: 'pincode', centre: 'centre-pin', back: 'packages' },
    },
    {
      id: 'pincode',
      type: 'input',
      data: {
        prompt: 'Please type your 6-digit PIN code so we can check home collection in your area.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'Now the full address for the visit — house or flat number, street and a landmark.',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so our phlebotomist can find you.',
      },
      next: 'home-ok',
    },
    {
      id: 'home-ok',
      type: 'text',
      data: {
        set: { centre: '$pick:Indiranagar|Koramangala|HSR Layout|Whitefield' },
        text: 'Good news — we collect at {{pincode}}. A phlebotomist from our {{centre}} centre will come to:\n{{address}}',
      },
      next: 'day',
    },
    {
      id: 'centre-pin',
      type: 'location',
      data: {
        set: { centre: 'Indiranagar' },
        location: {
          name: 'CityCare Diagnostics',
          address: HOSPITAL.address,
          lat: HOSPITAL.lat,
          lng: HOSPITAL.lng,
        },
        caption:
          'Your nearest centre: ground floor, CityCare Hospital. Open 6:30 am – 9 pm, all days. No queue with a booking.',
      },
      next: 'day',
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Which day suits you? ({{collection}})',
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
        text: 'Morning slots on {{dayLabel}}. Fasting tests are best done before 10 am.',
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
          from: 6,
          to: 12,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'summary', 'other-day': 'day' },
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:LBP', discount: '$price:50:20' },
        order: {
          orderId: '{{orderId}}',
          title: 'Lab test booking',
          items: [{ id: 'test', name: '{{test}}', qty: 1, price: '{{testPrice}}' }],
          adjustments: [
            { id: 'collection', label: 'Sample collection fee', amount: '{{collectionFee}}' },
            { id: 'discount', label: 'CityCare Care Card discount', amount: '-{{discount}}' },
          ],
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'paid' },
    },
    {
      id: 'paid',
      type: 'order',
      data: {
        set: { labId: '$id:LB' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [{ id: 'test', name: '{{test}}', qty: 1, price: '{{testPrice}}' }],
          adjustments: [
            { id: 'collection', label: 'Sample collection fee', amount: '{{collectionFee}}' },
            { id: 'discount', label: 'CityCare Care Card discount', amount: '-{{discount}}' },
          ],
          status: 'paid',
        },
      },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{labId}}',
          title: 'Lab test booked',
          subtitle: 'CityCare Diagnostics · {{centre}}',
          fields: [
            { label: 'Test', value: '{{test}}' },
            { label: 'Patient', value: '{{user.fullName}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Collection', value: '{{collection}}' },
            { label: 'Report in', value: '{{reportEta}}' },
          ],
          qrData: 'citycare://lab/{{labId}}?slot={{slot}}',
        },
        caption:
          'Show this QR to the phlebotomist or at the centre desk. Your report will arrive in this chat.',
      },
      next: 'who-collects',
    },
    {
      id: 'who-collects',
      type: 'condition',
      data: { cases: [{ id: 'home', var: 'mode', op: 'eq', value: 'home' }] },
      next: { home: 'phleb-intro', else: 'remind' },
    },
    {
      id: 'phleb-intro',
      type: 'text',
      data: {
        text: 'Ravi from our {{centre}} centre will collect your sample. He carries a CityCare ID card and a sealed, single-use kit.',
      },
      next: 'phleb',
    },
    {
      id: 'phleb',
      type: 'contact',
      data: {
        contact: {
          name: 'Ravi Kumar',
          phone: '+91 98450 22110',
          role: 'Phlebotomist, home collection',
          organisation: 'CityCare Diagnostics',
        },
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Sample collection reminder',
        note: 'Real use: the evening before.',
      },
      next: { next: 'booked', later: 'r-check' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'All set, {{user.firstName}}. We will send preparation tips the evening before.',
        showMenu: true,
      },
    },
    {
      id: 'r-check',
      type: 'condition',
      data: { cases: [{ id: 'fasting', var: 'fasting', op: 'eq', value: 'yes' }] },
      next: { fasting: 'r-fast', else: 'r-plain' },
    },
    {
      id: 'r-fast',
      type: 'image',
      data: {
        image: {
          icon: 'clock',
          accent: 'amber',
          title: 'Fasting 10–12 hours',
          subtitle: 'Water is fine',
        },
        caption:
          'Reminder for your {{test}} tomorrow at {{slot|time}}: Fasting 10–12 hours — nothing but water after 9 pm tonight. Take your regular medicines unless your doctor said otherwise.',
      },
      next: 'r-actions',
    },
    {
      id: 'r-plain',
      type: 'text',
      data: {
        text: 'Reminder: your {{test}} is tomorrow at {{slot|time}}. No fasting needed — eat and drink as usual.',
      },
      next: 'r-actions',
    },
    {
      id: 'r-actions',
      type: 'buttons',
      data: {
        text: 'Booking {{labId}} · {{collection}}',
        buttons: [
          { id: 'ok', title: 'Got it' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'help', title: 'Talk to us' },
        ],
      },
      next: { ok: 'r-ok', reschedule: 're-day', help: 'help' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'See you tomorrow, {{user.firstName}}.', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'Pick a new day — your payment carries over.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 're-slot' },
    },
    {
      id: 're-slot',
      type: 'list',
      data: {
        text: 'Morning slots on {{dayLabel}}:',
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
          from: 6,
          to: 12,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 're-done', 'other-day': 're-day' },
    },
    {
      id: 're-done',
      type: 'end',
      data: {
        text: 'Done — your collection moved to {{dayLabel}} at {{slot|time}}. Booking {{labId}} stays the same.',
        showMenu: true,
      },
    },
    {
      id: 'help',
      type: 'handoff',
      data: {
        agentName: 'Meera (CityCare Diagnostics)',
        text: 'Hi {{user.firstName}}, Meera here from the lab team. I can see booking {{labId}}. How can I help?',
      },
      next: 'help-end',
    },
    {
      id: 'help-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});

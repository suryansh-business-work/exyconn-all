/**
 * Service booking: registration and odometer → package → an optional free-text issue read by
 * `ai` → drop at the workshop or doorstep pickup → day → slot → review → estimate → QR job
 * card, calendar, map pin or driver note, and a reminder push to confirm or reschedule.
 */
import { defineWorkflow } from '../../author';
import { rupees } from '../healthcare/data';
import { DEALER, PERIODIC_SERVICES, REPAIR_SERVICES, type ServicePackage } from './data';

const DAY = 'day';
const MODE = 'mode';
const ISSUE_CHECK = 'issue-check';

function packageRow(item: ServicePackage) {
  return {
    id: item.id,
    title: item.title,
    description: `${item.subtitle} · ${rupees(item.price)}`,
    set: {
      service: item.title,
      servicePrice: String(item.price),
      serviceMrp: String(item.mrp),
      serviceHours: item.hours,
    },
  };
}

const ALL_PACKAGES = [...PERIODIC_SERVICES, ...REPAIR_SERVICES];

export const serviceBooking = defineWorkflow({
  key: 'service-booking',
  name: 'Book a service',
  description: 'Periodic service, repairs and AC care at our workshop',
  keywords: ['service', 'book service', 'car service', 'servicing', 'repair', 'oil change'],
  nodes: [
    {
      id: 'vehicle',
      type: 'input',
      data: {
        prompt:
          "Hi {{user.firstName}}, let's book your car in. Please type its registration number, e.g. MH 12 AB 1234.",
        var: 'vehicleNo',
        kind: 'text',
        error: 'Please type the full registration number, e.g. MH 12 AB 1234.',
      },
      next: 'odometer',
    },
    {
      id: 'odometer',
      type: 'input',
      data: {
        prompt: 'Roughly how many kilometres has {{vehicleNo}} run? Just the number, e.g. 32000.',
        var: 'odometer',
        kind: 'number',
        error: 'Please type the odometer reading as a number, e.g. 32000.',
      },
      next: 'package',
    },
    {
      id: 'package',
      type: 'list',
      data: {
        header: 'Choose a service',
        text: 'Which service does {{vehicleNo}} need? Prices include labour and standard consumables; parts are quoted before we fit them.',
        footer: 'Genuine parts · 1,000 km service warranty',
        button: 'View services',
        sections: [
          { id: 'periodic', title: 'Scheduled service', rows: PERIODIC_SERVICES.map(packageRow) },
          { id: 'repairs', title: 'Repairs and care', rows: REPAIR_SERVICES.map(packageRow) },
        ],
      },
      next: Object.fromEntries(ALL_PACKAGES.map((p) => [p.id, 'pkg-card'])),
    },
    {
      id: 'pkg-card',
      type: 'product',
      data: {
        product: {
          id: 'chosen-service',
          title: '{{service}}',
          subtitle: 'Takes about {{serviceHours}} · free pickup above ₹5,000',
          price: '{{servicePrice}}',
          mrp: '{{serviceMrp}}',
          image: { icon: 'tools', accent: 'blue', title: 'AutoNova Service' },
        },
      },
      next: 'issue-ask',
    },
    {
      id: 'issue-ask',
      type: 'buttons',
      data: {
        text: 'Anything specific you have noticed — a noise, a warning light, the AC? Telling us now saves time at the workshop.',
        buttons: [
          { id: 'describe', title: 'Describe an issue' },
          { id: 'none', title: 'No, all good', set: { issue: 'None reported' } },
        ],
      },
      next: { describe: 'issue', none: MODE },
    },
    {
      id: 'issue',
      type: 'ai',
      data: {
        set: { issue: '' },
        prompt:
          'Tell us in your own words — e.g. "AC is not cooling and there is a squeak from the front left wheel".',
        intents: [
          { id: 'ac', description: 'The air conditioning is weak, smells or does not cool' },
          { id: 'brakes', description: 'Brakes squeal, feel soft, or the car pulls when braking' },
          { id: 'noise', description: 'A rattle, knock or other noise while driving' },
          { id: 'electrical', description: 'Battery, starting trouble, lights or a warning lamp' },
          { id: 'other', description: 'Any other problem with the car' },
        ],
        entities: [{ name: 'issue', kind: 'text', description: 'The problem in a few words' }],
        retry: "Sorry, I couldn't quite follow that — our advisor will ask you at drop-off.",
      },
      next: {
        ac: ISSUE_CHECK,
        brakes: 'brake-safety',
        noise: ISSUE_CHECK,
        electrical: ISSUE_CHECK,
        other: ISSUE_CHECK,
        fallback: 'issue-later',
      },
    },
    {
      id: 'brake-safety',
      type: 'notice',
      data: {
        text: 'Brake trouble? If the pedal feels soft or sinks, please do not drive — choose doorstep pickup below.',
      },
      next: ISSUE_CHECK,
    },
    {
      id: ISSUE_CHECK,
      type: 'condition',
      data: {
        note: 'The AI may match an intent without pulling out the words.',
        cases: [{ id: 'has', var: 'issue', op: 'notEmpty' }],
      },
      next: { has: 'issue-ok', else: 'issue-later' },
    },
    {
      id: 'issue-ok',
      type: 'text',
      data: {
        text: 'Noted: *{{issue}}*. Our technician will check it during the service — inspection is free, and any repair is quoted before we start.',
      },
      next: MODE,
    },
    {
      id: 'issue-later',
      type: 'text',
      data: {
        set: { issue: 'To discuss at drop-off' },
        text: 'No problem — your service advisor will go through it with you when the car comes in.',
      },
      next: MODE,
    },
    {
      id: MODE,
      type: 'buttons',
      data: {
        text: 'How will the car reach us?',
        footer: 'Workshop open Mon–Sat, 8 am – 7 pm',
        buttons: [
          {
            id: 'drop',
            title: "I'll drop it",
            set: { mode: 'drop', handover: 'Drop at workshop', pickupFee: '0' },
          },
          {
            id: 'pickup',
            title: 'Doorstep pickup',
            set: { mode: 'pickup', handover: 'Pickup and drop', pickupFee: '499' },
          },
        ],
      },
      next: { drop: DAY, pickup: 'pincode' },
    },
    {
      id: 'pincode',
      type: 'input',
      data: {
        prompt: 'Please type your 6-digit PIN code so we can check pickup in your area.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'And the pickup address — house or flat number, society and a landmark.',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so our driver can find you.',
      },
      next: 'addr-ok',
    },
    {
      id: 'addr-ok',
      type: 'text',
      data: {
        text: 'Pickup is available at {{pincode}}. Our driver will collect {{vehicleNo}} from:\n{{address}}',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you? ({{handover}})',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Free workshop slots on {{dayLabel}} (IST). Morning slots are usually ready the same evening.',
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
          from: 8,
          to: 18,
          stepMin: 30,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'review', 'other-day': DAY },
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Car:* {{vehicleNo}} ({{odometer}} km)\n*Service:* {{service}}\n*Issue:* {{issue}}\n*Handover:* {{handover}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Estimate:* {{servicePrice|money}}, paid after the service',
        footer: 'Free cancellation up to 2 hours before',
        buttons: [
          { id: 'confirm', title: 'Confirm booking' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'estimate', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'estimate',
      type: 'order',
      data: {
        set: { estimateId: '$id:EST', discount: '$price:400:25' },
        order: {
          orderId: '{{estimateId}}',
          title: 'Service estimate',
          items: [{ id: 'service', name: '{{service}}', qty: 1, price: '{{servicePrice}}' }],
          adjustments: [
            { id: 'pickup', label: 'Pickup and drop', amount: '{{pickupFee}}' },
            { id: 'discount', label: 'AutoNova Care discount', amount: '-{{discount}}' },
          ],
          status: 'pending',
        },
      },
      next: 'jobcard',
    },
    {
      id: 'jobcard',
      type: 'ticket',
      data: {
        set: { bookingId: '$id:AN', bay: '$int:1:9' },
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Service booked',
          subtitle: 'AutoNova Service Centre, Baner',
          fields: [
            { label: 'Car', value: '{{vehicleNo}}' },
            { label: 'Service', value: '{{service}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Handover', value: '{{handover}}' },
            { label: 'Bay', value: 'B-{{bay}}' },
            { label: 'Advisor', value: 'Rohit Patil' },
          ],
          qrData: 'autonova://service/{{bookingId}}?slot={{slot}}&reg={{vehicleNo}}',
        },
        caption:
          'Show this QR at the service reception, or to our driver. Updates on {{vehicleNo}} will come to this chat.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the booking to your calendar, or call the workshop if anything changes.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{service}} — {{vehicleNo}}',
              start: '{{slot}}',
              durationMin: 60,
              location: DEALER.address,
            },
          },
          { kind: 'call', title: 'Call workshop', phone: DEALER.phone },
        ],
      },
      next: 'handover',
    },
    {
      id: 'handover',
      type: 'condition',
      data: { cases: [{ id: 'pickup', var: 'mode', op: 'eq', value: 'pickup' }] },
      next: { pickup: 'driver-note', else: 'pin' },
    },
    {
      id: 'driver-note',
      type: 'text',
      data: {
        text: 'Our driver will reach {{address}} about 30 minutes before {{slot|time}}. His name, photo ID and live location will arrive here on the day.',
      },
      next: 'remind',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: {
          name: DEALER.workshop,
          address: DEALER.address,
          lat: DEALER.lat,
          lng: DEALER.lng,
        },
        caption:
          'Enter from the Pashan side; service reception is at gate 2. A free shuttle drops you to Baner and Aundh.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Service reminder',
        note: 'Real use: the evening before.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'All set, {{user.firstName}}. We will remind you the evening before.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Service reminder',
        text: 'Reminder: {{vehicleNo}} is booked for {{service}} tomorrow at {{slot|time}} ({{handover}}).\nPlease leave the service book and the spare key in the car.',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Thank you, {{user.firstName}}. See you at {{slot|time}}.', showMenu: true },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'No problem. Pick a new day — booking {{bookingId}} stays the same.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: 're-slot' },
    },
    {
      id: 're-slot',
      type: 'list',
      data: {
        text: 'Free slots on {{dayLabel}}:',
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
          from: 8,
          to: 18,
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
        text: 'Done — {{vehicleNo}} is now booked for {{dayLabel}} at {{slot|time}}.',
        showMenu: true,
      },
    },
    {
      id: 'r-cancel',
      type: 'buttons',
      data: {
        text: 'Cancel booking {{bookingId}} for {{vehicleNo}}? Nothing has been charged.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel' },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'r-cancelled', keep: 'r-ok' },
    },
    {
      id: 'r-cancelled',
      type: 'end',
      data: {
        text: 'Your booking is cancelled. Book again from the menu whenever {{vehicleNo}} is due.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No booking was made. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});

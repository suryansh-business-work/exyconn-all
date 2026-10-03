/**
 * Technician booking: category → service rate card → service card → problem details →
 * address (saved or new, PIN-checked) → day → slot → contact (self or someone else) → review →
 * pay now or after the job → booking ticket with a start code, calendar, safety notice and a
 * "technician assigned" push with live tracking, reschedule and cancel.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import {
  CANCEL_REASONS,
  CATEGORIES,
  COMPANY,
  rupees,
  serviceVars,
  TECH_LIVE,
  type Category,
  type Service,
} from './data';
import { slotPicker } from './shared';

const DETAILS = 'details';
const REVIEW = 'review';
const TICKET = 'ticket';

function categoryRow(category: Category) {
  return {
    id: category.key,
    title: category.name,
    description: category.description,
    set: { category: category.name, categoryKey: category.key },
  };
}

function serviceRow(category: Category, service: Service) {
  return {
    id: service.id,
    title: service.title,
    description: `${service.duration} · ${rupees(service.price)} · ${service.warranty} warranty`,
    set: serviceVars(category, service),
  };
}

/** The rate card of one category; every service leads to that category's service card. */
function serviceList(category: Category): AuthorNode {
  return {
    id: `svc-${category.key}`,
    type: 'list',
    data: {
      header: category.name,
      text: '*{{category}}* — pick a service. Prices cover the visit and labour; spare parts are extra, at MRP, and only with your OK.',
      footer: 'Prices in ₹, taxes included',
      button: 'View services',
      sections: [
        {
          id: 'services',
          title: 'Services',
          rows: category.services.map((s) => serviceRow(category, s)),
        },
        {
          id: 'help',
          title: 'Not sure?',
          rows: [
            {
              id: 'not-sure',
              title: 'Describe the problem',
              description: 'Tell us in your own words and we will pick the right service',
            },
          ],
        },
      ],
    },
    next: {
      ...Object.fromEntries(category.services.map((s) => [s.id, `card-${category.key}`])),
      'not-sure': 'to-describe',
    },
  };
}

/** The chosen service as a product card, drawn with its category's icon. */
function serviceCard(category: Category): AuthorNode {
  return {
    id: `card-${category.key}`,
    type: 'product',
    data: {
      product: {
        id: 'chosen',
        title: '{{service}}',
        subtitle: '{{category}} · about {{duration}} · {{warranty}} warranty',
        price: '{{servicePrice}}',
        mrp: '{{serviceMrp}}',
        badge: 'Verified pros',
        image: { icon: category.icon, accent: 'blue', title: category.name },
        buttonTitle: 'Book this',
      },
    },
    next: { chosen: DETAILS },
  };
}

export const bookService = defineWorkflow({
  key: 'book-service',
  name: 'Book a technician',
  description: 'Plumber, electrician, AC, cleaning and more',
  keywords: [
    'book',
    'technician',
    'plumber',
    'electrician',
    'ac repair',
    'ac service',
    'cleaning',
    'carpenter',
    'pest control',
    'repair',
  ],
  nodes: [
    {
      id: 'category',
      type: 'list',
      data: {
        header: 'Book a technician',
        text: 'Sure, {{user.firstName}}. What do you need help with at home?',
        footer: 'Verified technicians, 8 am – 8 pm, all 7 days',
        button: 'Categories',
        sections: [{ id: 'categories', title: 'Services', rows: CATEGORIES.map(categoryRow) }],
      },
      next: Object.fromEntries(CATEGORIES.map((c) => [c.key, `svc-${c.key}`])),
    },
    ...CATEGORIES.map(serviceList),
    ...CATEGORIES.map(serviceCard),
    {
      id: 'to-describe',
      type: 'jump',
      data: { workflowKey: 'describe-problem' },
    },
    {
      id: DETAILS,
      type: 'buttons',
      data: {
        text: 'Would you like to tell the technician a little about the problem? It helps them bring the right tools and parts.',
        buttons: [
          { id: 'add', title: 'Add details' },
          { id: 'skip', title: 'Skip', set: { issue: 'Not specified' } },
          { id: 'back', title: 'Other services' },
        ],
      },
      next: { add: 'issue', skip: 'has-address', back: 'category' },
    },
    {
      id: 'issue',
      type: 'input',
      data: {
        prompt: 'Describe the problem in a line or two — e.g. "kitchen tap drips all night".',
        var: 'issue',
        kind: 'text',
        error: 'Please type a few words about the problem.',
      },
      next: 'has-address',
    },
    {
      id: 'has-address',
      type: 'condition',
      data: {
        note: 'Reuse an address given earlier in this chat.',
        cases: [{ id: 'saved', var: 'address', op: 'notEmpty' }],
      },
      next: { saved: 'saved-address', else: 'pincode' },
    },
    {
      id: 'saved-address',
      type: 'buttons',
      data: {
        text: 'Send the technician to your saved address?\n{{address}}, {{pincode}}',
        buttons: [
          { id: 'same', title: 'Yes, same address' },
          { id: 'new', title: 'New address' },
        ],
      },
      next: { same: 'day', new: 'pincode' },
    },
    {
      id: 'pincode',
      type: 'input',
      data: {
        prompt: 'Please type your 6-digit PIN code so we can check service in your area.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'Now the full address — flat or house number, building, street and a landmark.',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so the technician can find you.',
      },
      next: 'area-ok',
    },
    {
      id: 'area-ok',
      type: 'text',
      data: {
        set: { hub: '$pick:Baner|Kothrud|Viman Nagar|Hinjewadi|Wakad' },
        text: 'Good news — we serve {{pincode}}. A technician from our {{hub}} hub will come to:\n{{address}}',
      },
      next: 'day',
    },
    ...slotPicker({
      prefix: '',
      next: 'who',
      dayText: 'Which day suits you for the {{service}}?',
      slotText: 'Free slots on {{dayLabel}}. The job takes about {{duration}}.',
    }),
    {
      id: 'who',
      type: 'buttons',
      data: {
        text: 'Who should the technician call on arrival? You ({{user.fullName}}) or someone else at home?',
        buttons: [
          {
            id: 'self',
            title: 'Me',
            set: { contactName: '{{user.fullName}}', contactPhone: '{{user.phone}}' },
          },
          { id: 'other', title: 'Someone else' },
        ],
      },
      next: { self: 'own-phone', other: 'c-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: {
        note: 'The signed-in profile may have no phone; ask for one then.',
        cases: [{ id: 'missing', var: 'contactPhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: REVIEW },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should the technician call?',
        var: 'contactPhone',
        kind: 'phone',
      },
      next: REVIEW,
    },
    {
      id: 'c-name',
      type: 'input',
      data: { prompt: 'Name of the person at home?', var: 'contactName', kind: 'name' },
      next: 'c-phone',
    },
    {
      id: 'c-phone',
      type: 'input',
      data: {
        prompt: "{{contactName}}'s mobile number? The technician calls them on arrival.",
        var: 'contactPhone',
        kind: 'phone',
      },
      next: REVIEW,
    },
    {
      id: REVIEW,
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Service:* {{service}} ({{category}})\n*Problem:* {{issue}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Address:* {{address}}, {{pincode}}\n*Contact:* {{contactName}}, {{contactPhone}}\n*Price:* {{servicePrice|money}} + parts if needed',
        footer: 'Free cancellation up to 2 hours before',
        buttons: [
          { id: 'pay', title: 'Pay now', set: { payMode: 'Paid online' } },
          { id: 'later', title: 'Pay after service', set: { payMode: 'Pay after service' } },
          { id: 'change', title: 'Change time' },
        ],
      },
      next: { pay: 'secure', later: 'pay-later', change: 'day' },
    },
    {
      id: 'secure',
      type: 'notice',
      data: {
        text: "Payments are processed by HomeEase's payment partner. We never ask for your card PIN or OTP in this chat.",
      },
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:PAY', discount: '$price:50:20' },
        order: {
          orderId: '{{orderId}}',
          title: 'Home service booking',
          items: [{ id: 'service', name: '{{service}}', qty: 1, price: '{{servicePrice}}' }],
          adjustments: [
            { id: 'safety', label: 'Safety & hygiene kit', amount: 29 },
            { id: 'discount', label: 'Pay-online discount', amount: '-{{discount}}' },
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
        set: { bookingId: '$id:HE', otp: '$int:1000:9999' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [{ id: 'service', name: '{{service}}', qty: 1, price: '{{servicePrice}}' }],
          adjustments: [
            { id: 'safety', label: 'Safety & hygiene kit', amount: 29 },
            { id: 'discount', label: 'Pay-online discount', amount: '-{{discount}}' },
          ],
          status: 'paid',
        },
      },
      next: TICKET,
    },
    {
      id: 'pay-later',
      type: 'text',
      data: {
        set: { bookingId: '$id:HE', otp: '$int:1000:9999' },
        text: 'No payment now. Pay {{servicePrice|money}} plus any parts to the technician by UPI or card once the job is done — you get a GST invoice here.',
      },
      next: TICKET,
    },
    {
      id: TICKET,
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Booking confirmed',
          subtitle: '{{service}} · HomeEase Services',
          fields: [
            { label: 'Service', value: '{{service}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Address', value: '{{address}}' },
            { label: 'Contact', value: '{{contactName}}' },
            { label: 'Start code', value: '{{otp}}' },
            { label: 'Payment', value: '{{payMode}}' },
            { label: 'Warranty', value: '{{warranty}}' },
          ],
          qrData: 'homeease://job/{{bookingId}}?slot={{slot}}',
        },
        caption:
          'Share the 4-digit start code with the technician only when they reach your door — the job starts after that.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the visit to your calendar, or call us if anything changes.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'HomeEase: {{service}}',
              start: '{{slot}}',
              durationMin: 60,
              location: '{{address}}',
            },
          },
          { kind: 'call', title: 'Call HomeEase', phone: COMPANY.phone },
        ],
      },
      next: 'safety',
    },
    {
      id: 'safety',
      type: 'notice',
      data: {
        text: 'Every HomeEase technician is background-verified, carries a photo ID and wears a mask and shoe covers in your home.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Technician assigned',
        note: 'Real use: a few hours before the slot.',
      },
      next: { next: 'booked', later: 'assigned' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'All set, {{user.firstName}}. We will message you here once a technician is assigned.',
        showMenu: true,
      },
    },
    {
      id: 'assigned',
      type: 'text',
      data: {
        text: 'Hi {{user.firstName}}, {{techName}} ({{techRating}}★ · {{techJobs}} jobs · {{techYears}} yrs) will handle your {{service}} on {{dayLabel}} at {{slot|time}}.',
      },
      next: 'tech-card',
    },
    {
      id: 'tech-card',
      type: 'contact',
      data: {
        contact: {
          name: '{{techName}}',
          phone: '{{techPhone}}',
          role: '{{category}} technician',
          organisation: 'HomeEase Services',
        },
      },
      next: 'on-way',
    },
    {
      id: 'on-way',
      type: 'buttons',
      data: {
        text: 'Booking {{bookingId}} · start code {{otp}}',
        buttons: [
          { id: 'track', title: 'Track technician', set: { eta: '$int:8:25' } },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel booking' },
        ],
      },
      next: { track: 'live', reschedule: 're-day', cancel: 'cancel-reason' },
    },
    {
      id: 'live',
      type: 'location',
      data: {
        location: {
          name: '{{techName}} · live location',
          address: 'Baner–Pashan Link Road, Pune',
          lat: TECH_LIVE.lat,
          lng: TECH_LIVE.lng,
        },
        caption:
          '{{techName}} is about {{eta}} minutes away. Share start code {{otp}} only once they arrive.',
      },
      next: 'track-cta',
    },
    {
      id: 'track-cta',
      type: 'cta',
      data: {
        text: 'Follow the visit live, or call {{techName}} directly.',
        actions: [
          { kind: 'url', title: 'Live tracking', url: COMPANY.track },
          { kind: 'call', title: 'Call technician', phone: '{{techPhone}}' },
        ],
      },
      next: 'track-end',
    },
    {
      id: 'track-end',
      type: 'end',
      data: { text: 'We will send your invoice here once the job is done.', showMenu: true },
    },
    ...slotPicker({
      prefix: 're-',
      next: 're-done',
      dayText: 'No problem. Pick a new day — any payment carries over.',
      slotText: 'Free slots on {{dayLabel}}:',
    }),
    {
      id: 're-done',
      type: 'end',
      data: {
        text: 'Done — booking {{bookingId}} moved to {{dayLabel}} at {{slot|time}}. Your start code stays {{otp}}.',
        showMenu: true,
      },
    },
    {
      id: 'cancel-reason',
      type: 'list',
      data: {
        text: 'Sorry to see you cancel. Could you tell us why?',
        button: 'Choose reason',
        sections: [
          {
            id: 'reasons',
            title: 'Reasons',
            rows: CANCEL_REASONS.map((r) => ({ ...r, set: { cancelReason: r.title } })),
          },
        ],
      },
      next: Object.fromEntries(CANCEL_REASONS.map((r) => [r.id, 'cancel-confirm'])),
    },
    {
      id: 'cancel-confirm',
      type: 'buttons',
      data: {
        text: 'Cancel booking {{bookingId}} for {{service}}? Anything you paid goes back to the original payment method in 3–5 working days.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel', set: { refundId: '$id:RF' } },
          { id: 'keep', title: 'Keep booking' },
        ],
      },
      next: { yes: 'cancelled', keep: 'kept' },
    },
    {
      id: 'cancelled',
      type: 'end',
      data: {
        text: 'Booking {{bookingId}} is cancelled ({{cancelReason}}). Refund reference: {{refundId}}.',
        showMenu: true,
      },
    },
    {
      id: 'kept',
      type: 'end',
      data: {
        text: 'Great — {{techName}} will see you on {{dayLabel}} at {{slot|time}}.',
        showMenu: true,
      },
    },
  ],
});

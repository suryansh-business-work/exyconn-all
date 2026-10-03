/**
 * Grooming: package carousel → pet size → salon or the mobile spa van at home → notes for the
 * groomer → day → slot → order with size and van fees → pay → QR ticket, groomer card →
 * "ready for pickup" push → rating and review link.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { rupees } from '../healthcare/data';
import { CLINIC, GROOMER, GROOMING, PET_SIZES, type GroomPackage } from './data';

const SIZE = 'size';
const WHERE = 'where';
const DAY = 'day';
const RATE = 'rate';

function groomCard(item: GroomPackage): Product {
  return {
    id: item.id,
    title: item.title,
    subtitle: `${item.subtitle} · ${item.minutes} min`,
    price: item.price,
    mrp: item.mrp,
    badge: item.badge,
    image: { icon: item.icon, accent: 'orange', title: item.title },
    buttonTitle: 'Book this',
    set: { groom: item.title, groomPrice: String(item.price), groomMins: String(item.minutes) },
  };
}

export const grooming = defineWorkflow({
  key: 'grooming',
  name: 'Grooming & spa',
  description: 'Baths, haircuts and tick spa at the salon or at home',
  keywords: ['grooming', 'groom', 'bath', 'haircut', 'spa', 'nail trim', 'ticks'],
  nodes: [
    {
      id: 'packages',
      type: 'carousel',
      data: {
        text: 'Pamper time, {{user.firstName}}! Vet-approved shampoos, certified groomers and no sedation. Pick a package:',
        cards: GROOMING.map(groomCard),
      },
      next: Object.fromEntries(GROOMING.map((g) => [g.id, 'pet-name'])),
    },
    {
      id: 'pet-name',
      type: 'input',
      data: { prompt: "Lovely choice. What is your pet's name?", var: 'petName', kind: 'text' },
      next: SIZE,
    },
    {
      id: SIZE,
      type: 'list',
      data: {
        text: 'How big is {{petName}}? Bigger coats take longer, so the price changes by size.',
        button: 'Choose size',
        sections: [
          {
            id: 'sizes',
            title: 'Size',
            rows: PET_SIZES.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.fee ? `+${rupees(s.fee)}` : 'No extra charge',
              set: { sizeLabel: s.short, sizeFee: String(s.fee) },
            })),
          },
        ],
      },
      next: Object.fromEntries(PET_SIZES.map((s) => [s.id, WHERE])),
    },
    {
      id: WHERE,
      type: 'buttons',
      data: {
        text: 'Where should we groom {{petName}}?',
        footer: 'Spa van covers Jubilee Hills, Banjara Hills, Madhapur',
        buttons: [
          {
            id: 'salon',
            title: 'At the salon',
            set: { place: 'salon', placeLabel: 'PawPal salon, Jubilee Hills', vanFee: '0' },
          },
          { id: 'home', title: 'Spa van at home', set: { place: 'home', vanFee: '349' } },
        ],
      },
      next: { salon: 'notes', home: 'pincode' },
    },
    {
      id: 'pincode',
      type: 'input',
      data: {
        prompt: 'Your 6-digit PIN code, please, to check the van covers your area.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'And the address where the van should park? The groom happens inside the van.',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so the van can find you.',
      },
      next: 'addr-ok',
    },
    {
      id: 'addr-ok',
      type: 'text',
      data: {
        set: { placeLabel: 'Spa van at {{address}}' },
        text: 'The spa van covers {{pincode}}. It needs a spot about the size of a car near your gate.',
      },
      next: 'notes',
    },
    {
      id: 'notes',
      type: 'input',
      data: {
        prompt:
          'Anything the groomer should know? Allergies, a sensitive spot, a style you like — or type *none*.',
        var: 'groomNotes',
        kind: 'text',
      },
      next: DAY,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits {{petName}}?',
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
        text: 'Free grooming slots on {{dayLabel}}. {{groom}} takes about {{groomMins}} minutes.',
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
          from: 9,
          to: 19,
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'summary', 'other-day': DAY },
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:GRM', discount: '$price:100:30' },
        order: {
          orderId: '{{orderId}}',
          title: 'Grooming for {{petName}}',
          items: [{ id: 'groom', name: '{{groom}}', qty: 1, price: '{{groomPrice}}' }],
          adjustments: [
            { id: 'size', label: 'Size: {{sizeLabel}}', amount: '{{sizeFee}}' },
            { id: 'van', label: 'Spa van visit', amount: '{{vanFee}}' },
            { id: 'discount', label: 'PawPal Club discount', amount: '-{{discount}}' },
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
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [{ id: 'groom', name: '{{groom}}', qty: 1, price: '{{groomPrice}}' }],
          adjustments: [
            { id: 'size', label: 'Size: {{sizeLabel}}', amount: '{{sizeFee}}' },
            { id: 'van', label: 'Spa van visit', amount: '{{vanFee}}' },
            { id: 'discount', label: 'PawPal Club discount', amount: '-{{discount}}' },
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
        set: { groomId: '$id:GR' },
        complete: true,
        ticket: {
          ticketId: '{{groomId}}',
          title: 'Grooming booked',
          subtitle: 'PawPal Spa',
          fields: [
            { label: 'Pet', value: '{{petName}} ({{sizeLabel}})' },
            { label: 'Package', value: '{{groom}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Where', value: '{{placeLabel}}' },
            { label: 'Notes', value: '{{groomNotes}}' },
          ],
          qrData: 'pawpal://groom/{{groomId}}?slot={{slot}}',
        },
        caption: 'Tip: a short walk before the session helps {{petName}} settle.',
      },
      next: 'where-check',
    },
    {
      id: 'where-check',
      type: 'condition',
      data: { cases: [{ id: 'home', var: 'place', op: 'eq', value: 'home' }] },
      next: { home: 'groomer', else: 'pin' },
    },
    {
      id: 'groomer',
      type: 'contact',
      data: {
        contact: {
          name: GROOMER.name,
          phone: GROOMER.phone,
          role: GROOMER.role,
          organisation: 'PawPal Spa',
        },
      },
      next: 'remind',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: CLINIC.name, address: CLINIC.address, lat: CLINIC.lat, lng: CLINIC.lng },
        caption:
          'The spa is on the first floor, above the clinic. You can wait in our café or leave {{petName}} with us.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Grooming done', note: 'Real use: when the groom finishes.' },
      next: { next: 'booked', later: 'ready' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'Booked! We will message you when {{petName}} is ready.', showMenu: true },
    },
    {
      id: 'ready',
      type: 'image',
      data: {
        image: { icon: 'pet', accent: 'orange', title: 'All done!', subtitle: '{{groom}}' },
        caption:
          '{{petName}} is fresh, fluffy and ready, {{user.firstName}}! Nails trimmed, ears cleaned — and very good throughout.',
      },
      next: RATE,
    },
    {
      id: RATE,
      type: 'buttons',
      data: {
        text: 'How did we do today?',
        buttons: [
          { id: 'excellent', title: 'Paw-some!' },
          { id: 'good', title: 'Good' },
          { id: 'poor', title: 'Not happy' },
        ],
      },
      next: { excellent: 'review', good: 'review', poor: 'poor' },
    },
    {
      id: 'review',
      type: 'cta',
      data: {
        text: 'Thank you! Share a review — and book the next groom in 4–6 weeks to keep the coat healthy.',
        actions: [{ kind: 'url', title: 'Write a review', url: CLINIC.review }],
      },
      next: 'review-end',
    },
    {
      id: 'review-end',
      type: 'end',
      data: { text: 'See you next time, {{petName}}!', showMenu: true },
    },
    {
      id: 'poor',
      type: 'input',
      data: { prompt: 'We are sorry. What was not right?', var: 'feedback', kind: 'text' },
      next: 'poor-ack',
    },
    {
      id: 'poor-ack',
      type: 'end',
      data: {
        set: { feedbackId: '$id:FB' },
        text: 'Thank you for telling us. Our spa manager will call you today (reference {{feedbackId}}), and the next bath is on us.',
        showMenu: true,
      },
    },
  ],
});

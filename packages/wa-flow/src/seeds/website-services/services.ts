/**
 * Explore our services: a carousel of service cards → one detail card (filled from the card's
 * variables) → book a consultation, get an estimate, or browse again.
 */
import { defineWorkflow } from '../../author';
import { SERVICES } from './data';

const CARDS = 'cards';

export const services = defineWorkflow({
  key: 'services',
  name: 'Explore our services',
  description: 'Web, AI, cloud, design, data and growth',
  keywords: ['services', 'what do you do', 'capabilities', 'offerings', 'what you offer'],
  nodes: [
    {
      id: 'intro',
      type: 'image',
      data: {
        image: {
          icon: 'laptop',
          accent: 'indigo',
          title: 'Northstar Digital',
          subtitle: 'Design, build and scale',
        },
        caption:
          'Hi {{user.firstName}} 👋 We design, build and run digital products for ambitious teams — 180+ launches across 14 industries.',
      },
      next: CARDS,
    },
    {
      id: CARDS,
      type: 'carousel',
      data: {
        text: 'Here is what we do best. Swipe through and tap a service to learn more.',
        cards: SERVICES.map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: s.weeks,
          price: s.from,
          badge: s.badge,
          image: { icon: s.icon, accent: 'indigo', title: s.name },
          buttonTitle: 'Learn more',
          set: { svcName: s.name, svcPitch: s.pitch, svcFrom: String(s.from), svcWeeks: s.weeks },
        })),
      },
      next: Object.fromEntries(SERVICES.map((s) => [s.id, 'detail'])),
    },
    {
      id: 'detail',
      type: 'buttons',
      data: {
        complete: true,
        header: '{{svcName}}',
        text: '{{svcPitch}}\n\nStarts at *{{svcFrom|money}}* · typical timeline *{{svcWeeks}}*. Every engagement includes a dedicated project lead, weekly demos and 30 days of free hypercare.',
        footer: 'Prices exclude GST',
        buttons: [
          { id: 'consult', title: 'Free consultation' },
          { id: 'quote', title: 'Get an estimate' },
          { id: 'more', title: 'Other services' },
        ],
      },
      next: { consult: 'to-consult', quote: 'to-estimate', more: CARDS },
    },
    {
      id: 'to-consult',
      type: 'jump',
      data: { set: { topic: '{{svcName}}' }, workflowKey: 'consult' },
    },
    { id: 'to-estimate', type: 'jump', data: { workflowKey: 'estimate' } },
  ],
});

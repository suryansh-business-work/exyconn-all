/**
 * Annual care plans (AMC): plan carousel → number of appliances (per-unit plans; 3 or more
 * goes to a sales quote) → coverage → start date → contract email → order → paid → contract
 * PDF → a "first visit due" push that books the slot.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import type { Product } from '../../schema';
import { CARE_PLANS, COMPANY, type CarePlan } from './data';

const COVERAGE = 'coverage';

const unitsLabel = (count: number, unit: string): string =>
  `${count} ${unit}${count > 1 ? 's' : ''}`;

function planCard(plan: CarePlan): Product {
  return {
    id: plan.id,
    title: plan.title,
    subtitle: plan.perUnit ? `${plan.subtitle} · per ${plan.perUnit}` : plan.subtitle,
    price: plan.price,
    mrp: plan.mrp,
    badge: plan.badge,
    image: { icon: plan.icon, accent: 'blue', title: plan.title },
    buttonTitle: 'Choose plan',
    set: {
      plan: plan.title,
      planUnit: plan.perUnit ?? 'home',
      visits: plan.visits,
      covers: plan.covers,
      planQty: 'Whole home',
      planTotal: String(plan.price),
    },
  };
}

/** How many appliances a per-unit plan covers; totals are worked out here, not in the chat. */
function unitsNode(plan: CarePlan, unit: string): AuthorNode {
  const option = (count: number) => ({
    id: `u${count}`,
    title: unitsLabel(count, unit),
    set: { planQty: unitsLabel(count, unit), planTotal: String(plan.price * count) },
  });
  return {
    id: `units-${plan.id}`,
    type: 'buttons',
    data: {
      set: { planPrice: String(plan.price) },
      text: `How many ${unit}s should the *{{plan}}* cover? Each is {{planPrice|money}} a year.`,
      buttons: [option(1), option(2), { id: 'more', title: '3 or more' }],
    },
    next: { u1: COVERAGE, u2: COVERAGE, more: 'bulk' },
  };
}

const perUnitPlans = CARE_PLANS.flatMap((p) => (p.perUnit ? [{ plan: p, unit: p.perUnit }] : []));

export const carePlans = defineWorkflow({
  key: 'care-plans',
  name: 'Annual care plans',
  description: 'AMC for AC, RO and the whole home',
  keywords: ['amc', 'annual maintenance', 'care plan', 'plan', 'subscription', 'contract'],
  nodes: [
    {
      id: 'plans',
      type: 'carousel',
      data: {
        text: 'Hi {{user.firstName}}, a HomeEase care plan covers regular servicing and breakdown visits for a whole year — no visiting charges, priority slots. Swipe to compare.',
        cards: CARE_PLANS.map(planCard),
      },
      next: Object.fromEntries(
        CARE_PLANS.map((p) => [p.id, p.perUnit ? `units-${p.id}` : COVERAGE]),
      ),
    },
    ...perUnitPlans.map(({ plan, unit }) => unitsNode(plan, unit)),
    {
      id: 'bulk',
      type: 'input',
      data: {
        prompt: 'How many {{planUnit}}s in all? We have special rates for 3 or more.',
        var: 'units',
        kind: 'number',
        error: 'Please type a number, e.g. 4.',
      },
      next: 'bulk-agent',
    },
    {
      id: 'bulk-agent',
      type: 'handoff',
      data: {
        agentName: 'Rohit (HomeEase plans)',
        text: "Hi {{user.firstName}}, I'm Rohit from the care plans team. For {{units}} {{planUnit}}s on the {{plan}} I can offer a custom yearly rate — let me put a quote together for you.",
      },
      next: 'bulk-end',
    },
    {
      id: 'bulk-end',
      type: 'end',
      data: { text: 'Rohit will share your quote here shortly.', showMenu: true },
    },
    {
      id: COVERAGE,
      type: 'text',
      data: {
        text: '*{{plan}}* — {{planQty}}\n*Visits:* {{visits}}\n*Covers:* {{covers}}\n*Price:* {{planTotal|money}} for 12 months from the first visit.',
      },
      next: 'start-day',
    },
    {
      id: 'start-day',
      type: 'list',
      data: {
        text: 'When should the plan start? We will do the first visit that day.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, var: 'day' },
      },
      next: { pick: 'has-email' },
    },
    {
      id: 'has-email',
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'user.email', op: 'empty' }] },
      next: { missing: 'ask-email', else: 'email' },
    },
    {
      id: 'email',
      type: 'buttons',
      data: {
        text: 'Where should we email the plan contract and GST invoice?',
        buttons: [
          { id: 'mine', title: 'My email', set: { contractEmail: '{{user.email}}' } },
          { id: 'other', title: 'Another email' },
        ],
      },
      next: { mine: 'summary', other: 'ask-email' },
    },
    {
      id: 'ask-email',
      type: 'input',
      data: {
        prompt: 'Please type the email address for the contract and invoice.',
        var: 'contractEmail',
        kind: 'email',
      },
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:PAY', offer: '$price:200:25' },
        order: {
          orderId: '{{orderId}}',
          title: 'Annual care plan',
          items: [{ id: 'plan', name: '{{plan}} · {{planQty}}', qty: 1, price: '{{planTotal}}' }],
          adjustments: [{ id: 'offer', label: 'Festive offer', amount: '-{{offer}}' }],
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
        set: { contractId: '$id:AMC' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [{ id: 'plan', name: '{{plan}} · {{planQty}}', qty: 1, price: '{{planTotal}}' }],
          adjustments: [{ id: 'offer', label: 'Festive offer', amount: '-{{offer}}' }],
          status: 'paid',
        },
      },
      next: 'contract',
    },
    {
      id: 'contract',
      type: 'document',
      data: {
        complete: true,
        document: {
          fileName: 'HomeEase_Care_Plan_Contract.pdf',
          fileType: 'PDF',
          pages: 4,
          sizeKb: 286,
          preview: {
            title: 'Annual care plan contract',
            subtitle: '{{plan}} · {{planQty}}',
            sections: [
              {
                kind: 'fields',
                heading: 'Contract',
                fields: [
                  { label: 'Contract no.', value: '{{contractId}}' },
                  { label: 'Customer', value: '{{user.fullName}}' },
                  { label: 'Email', value: '{{contractEmail}}' },
                  { label: 'Starts', value: '{{day|day}}' },
                  { label: 'Term', value: '12 months from the first visit' },
                  { label: 'Payment', value: '{{orderId}} · paid' },
                ],
              },
              {
                kind: 'table',
                heading: 'Visit schedule',
                columns: ['Visit', 'When', 'What'],
                rows: [
                  { id: 'v1', cells: ['1', '{{day|day}}', 'Inspection and full service'] },
                  { id: 'v2', cells: ['2', 'Month 4', 'Scheduled service'] },
                  { id: 'v3', cells: ['3', 'Month 8', 'Scheduled service'] },
                  { id: 'bd', cells: ['Breakdowns', 'Any time', 'Priority visit within 24 hrs'] },
                ],
              },
              {
                kind: 'text',
                heading: 'What is covered',
                text: '{{covers}}. Visiting charges are waived for the whole term. Spare parts outside the plan are charged at MRP with 10% off, only after your approval. Damage from power surges, water seepage or physical impact is not covered.',
              },
            ],
            footer: 'HomeEase Services · Baner, Pune · GSTIN 27AAACH0000A1Z5 (dummy)',
          },
        },
        caption:
          'Your {{plan}} is active, {{user.firstName}}. A copy is on its way to {{contractEmail}}.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'First plan visit due',
        note: 'Real use: two days before each scheduled visit.',
      },
      next: { next: 'active', later: 'visit-due' },
    },
    {
      id: 'active',
      type: 'end',
      data: {
        text: 'We will remind you here before every scheduled visit.',
        showMenu: true,
      },
    },
    {
      id: 'visit-due',
      type: 'buttons',
      data: {
        header: 'Plan visit due',
        text: 'Hi {{user.firstName}}, your {{plan}} visit is due on {{day|day}}. Pick a time and we will send a technician — no charge under contract {{contractId}}.',
        buttons: [
          { id: 'book', title: 'Pick a time' },
          { id: 'later', title: 'Remind me later' },
        ],
      },
      next: { book: 'v-slot', later: 'v-later' },
    },
    {
      id: 'v-slot',
      type: 'list',
      data: {
        text: 'Free slots on {{day|day}}:',
        footer: 'Times in IST',
        button: 'Choose time',
        sections: [],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 8,
          to: 20,
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'v-done' },
    },
    {
      id: 'v-done',
      type: 'end',
      data: {
        text: 'Booked: {{plan}} visit on {{day|day}} at {{slot|time}}. Questions? Call us on {{supportPhone}}.',
        set: { supportPhone: COMPANY.phone },
        showMenu: true,
      },
    },
    {
      id: 'v-later',
      type: 'end',
      data: { text: 'Okay — we will check in again tomorrow.', showMenu: true },
    },
  ],
});

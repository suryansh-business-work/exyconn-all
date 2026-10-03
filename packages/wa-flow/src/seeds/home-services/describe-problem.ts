/**
 * Describe a problem in free text ("kitchen sink leak ho raha hai, kal shaam 5 baje aa
 * sakte ho?"): an `ai` node reads the trade, the problem and the wished-for time, suggests a
 * starter service, books the asked time (or a slot from the list), and sends a "technician on
 * the way" push. Emergencies get safety steps and the on-call desk; anything unreadable falls
 * back to buttons.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import {
  categoryOf,
  COMPANY,
  EMERGENCY_DESK,
  QUICK_FIXES,
  serviceVars,
  SUPPORT,
  type QuickFix,
} from './data';
import { slotPicker } from './shared';

const ASK = 'ask';
const DIAGNOSIS = 'diagnosis';
const AGENT = 'agent';
const PINCODE = 'pincode';

/** Stores the starter service for one intent, then shows the diagnosis. */
function fixNode(fix: QuickFix): AuthorNode {
  const category = categoryOf(fix.categoryKey);
  const service = category.services.find((s) => s.id === fix.serviceId) ?? category.services[0];
  return {
    id: `fix-${fix.intent}`,
    type: 'delay',
    data: { ms: 400, set: serviceVars(category, service) },
    next: DIAGNOSIS,
  };
}

export const describeProblem = defineWorkflow({
  key: 'describe-problem',
  name: 'Describe a problem',
  description: 'Tell us what is wrong in your own words',
  keywords: ['problem', 'issue', 'not working', 'leak', 'broken', 'urgent', 'emergency'],
  nodes: [
    {
      id: ASK,
      type: 'ai',
      data: {
        set: { issue: 'the problem you described', when: '', whenMs: '' },
        prompt:
          'Tell us what is wrong and when you would like us to come — for example, "kitchen sink is leaking, kal shaam 5 baje aa sakte ho?"',
        intents: [
          ...QUICK_FIXES.map((f) => ({ id: f.intent, description: f.description })),
          {
            id: 'emergency',
            description:
              'Danger right now: gas smell, sparking or burning smell, electric shock, flooding',
          },
          {
            id: 'other',
            description: 'A question about prices, plans, an invoice or anything else',
          },
        ],
        entities: [
          { name: 'issue', kind: 'text', description: 'The problem in a few words' },
          {
            name: 'when',
            kind: 'datetime',
            description: 'When the customer wants the visit, e.g. "tomorrow evening 5 pm"',
          },
        ],
        retry: "Sorry, I couldn't quite follow that.",
      },
      next: {
        ...Object.fromEntries(QUICK_FIXES.map((f) => [f.intent, `fix-${f.intent}`])),
        emergency: 'sos',
        other: AGENT,
        fallback: 'not-sure',
      },
    },
    ...QUICK_FIXES.map(fixNode),
    {
      id: DIAGNOSIS,
      type: 'buttons',
      data: {
        header: 'Here is what we suggest',
        text: 'Got it, {{user.firstName}} — this sounds like a *{{category}}* job.\n*Problem:* {{issue}}\nWe suggest *{{service}}* at {{servicePrice|money}} (about {{duration}}, {{warranty}} warranty). The technician confirms the price before starting.',
        buttons: [
          { id: 'book', title: 'Book a visit' },
          { id: 'browse', title: 'Other services' },
          { id: 'expert', title: 'Ask an expert' },
        ],
      },
      next: { book: 'has-time', browse: 'to-book', expert: AGENT },
    },
    {
      id: 'has-time',
      type: 'condition',
      data: {
        note: 'The AI turns "kal shaam 5 baje" into whenMs (epoch ms) when it can.',
        cases: [{ id: 'asked', var: 'whenMs', op: 'notEmpty' }],
      },
      next: { asked: 'use-time', else: 'day' },
    },
    {
      id: 'use-time',
      type: 'buttons',
      data: {
        text: 'You asked for *{{when}}*. Shall we book {{whenMs|day}} at {{whenMs|time}}?',
        buttons: [
          { id: 'yes', title: 'Yes, book it', set: { slot: '{{whenMs}}' } },
          { id: 'other', title: 'Another time' },
        ],
      },
      next: { yes: PINCODE, other: 'day' },
    },
    ...slotPicker({
      prefix: '',
      next: PINCODE,
      dayText: 'Which day suits you for the {{service}}?',
      slotText: 'Free slots on {{dayLabel}}. The job takes about {{duration}}.',
    }),
    {
      id: PINCODE,
      type: 'input',
      data: {
        prompt: 'Your 6-digit PIN code, please?',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'address',
    },
    {
      id: 'address',
      type: 'input',
      data: {
        prompt: 'And the full address — flat or house number, building, street and a landmark.',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so the technician can find you.',
      },
      next: 'confirm',
    },
    {
      id: 'confirm',
      type: 'buttons',
      data: {
        header: 'Confirm your visit',
        text: '*Service:* {{service}}\n*Problem:* {{issue}}\n*When:* {{slot|day}} at {{slot|time}}\n*Address:* {{address}}, {{pincode}}\n*Name:* {{user.fullName}}\n*Price:* {{servicePrice|money}}, pay after the job',
        footer: 'Free cancellation up to 2 hours before',
        buttons: [
          {
            id: 'confirm',
            title: 'Confirm visit',
            set: { bookingId: '$id:HE', otp: '$int:1000:9999' },
          },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'ticket', change: 'day', cancel: 'not-booked' },
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Visit booked',
          subtitle: '{{category}} · HomeEase Services',
          fields: [
            { label: 'Service', value: '{{service}}' },
            { label: 'Problem', value: '{{issue}}' },
            { label: 'Date', value: '{{slot|day}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Address', value: '{{address}}' },
            { label: 'Start code', value: '{{otp}}' },
            { label: 'Payment', value: 'After the job' },
          ],
          qrData: 'homeease://job/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Share the start code with the technician only when they reach your door.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Technician on the way',
        note: 'Real use: when the technician starts the trip.',
      },
      next: { next: 'booked', later: 'en-route' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'All set, {{user.firstName}}. We will tell you here when the technician sets off.',
        showMenu: true,
      },
    },
    {
      id: 'en-route',
      type: 'cta',
      data: {
        header: 'Technician on the way',
        text: '{{techName}} ({{techRating}}★) has set off for your {{service}} and should reach in about 20 minutes. Keep start code {{otp}} handy.',
        actions: [
          { kind: 'url', title: 'Track live', url: COMPANY.track },
          { kind: 'call', title: 'Call technician', phone: '{{techPhone}}' },
        ],
      },
      next: 'route-end',
    },
    {
      id: 'route-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'sos',
      type: 'cta',
      data: {
        header: 'Safety first',
        text: 'If you smell gas: do not switch anything on or off, open the windows, close the cylinder valve and step outside.\nFor sparking or flooding: switch off the main MCB or water valve only if it is safe to reach.\nOur emergency team is on call 24×7.',
        actions: [
          { kind: 'call', title: 'Call emergency desk', phone: COMPANY.emergency },
          { kind: 'url', title: 'Safety guide', url: COMPANY.safety },
        ],
      },
      next: 'sos-agent',
    },
    {
      id: 'sos-agent',
      type: 'handoff',
      data: {
        complete: true,
        agentName: EMERGENCY_DESK.agentName,
        text: "Hi {{user.firstName}}, I'm Sandeep from the HomeEase emergency desk. Are you and everyone at home safe? Send me your address and I will send the nearest technician right away.",
      },
      next: 'sos-card',
    },
    {
      id: 'sos-card',
      type: 'contact',
      data: {
        contact: {
          name: EMERGENCY_DESK.name,
          phone: EMERGENCY_DESK.phone,
          role: EMERGENCY_DESK.role,
          organisation: 'HomeEase Services',
        },
      },
      next: 'sos-end',
    },
    {
      id: 'sos-end',
      type: 'end',
      data: { text: 'Stay safe, {{user.firstName}}.', showMenu: true },
    },
    {
      id: AGENT,
      type: 'handoff',
      data: {
        agentName: SUPPORT.agentName,
        text: "Hi {{user.firstName}}, I'm Kavita from HomeEase support. I have your message here — give me a moment and I'll help you out.",
      },
      next: 'agent-end',
    },
    {
      id: 'agent-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'not-sure',
      type: 'buttons',
      data: {
        text: "Sorry, I couldn't tell what needs fixing. Pick a service yourself, try describing it again, or talk to our team.",
        buttons: [
          { id: 'browse', title: 'Browse services' },
          { id: 'retry', title: 'Try again' },
          { id: 'agent', title: 'Talk to us' },
        ],
      },
      next: { browse: 'to-book', retry: ASK, agent: AGENT },
    },
    {
      id: 'to-book',
      type: 'jump',
      data: { workflowKey: 'book-service' },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No visit was booked. Message us any time something needs fixing.',
        showMenu: true,
      },
    },
  ],
});

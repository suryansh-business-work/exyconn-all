/**
 * Talk to sales: the visitor describes the need in their own words; an `ai` node reads the
 * intent (estimate, meeting, support or a person) and the company and budget → routes to that
 * workflow, or hands over to a sales lead with their contact card, office pin and call button.
 */
import { defineWorkflow } from '../../author';
import { AGENCY } from './data';

const HUMAN = 'human';

export const sales = defineWorkflow({
  key: 'sales',
  name: 'Talk to sales',
  description: 'Tell us what you need, or chat with a person',
  keywords: ['sales', 'talk to someone', 'human', 'agent', 'contact', 'partner with you'],
  nodes: [
    {
      id: 'ask',
      type: 'ai',
      data: {
        set: { company: '', budget: '' },
        prompt:
          'Tell me in a line what you are working on — for example "a booking app for our 12 clinics, budget around 15 lakh" — and I will get the right person on it.',
        intents: [
          { id: 'estimate', description: 'Wants a price, quote or estimate for a project' },
          { id: 'meeting', description: 'Wants a call, demo or meeting with the team' },
          { id: 'support', description: 'Existing client reporting a problem with their project' },
          { id: 'person', description: 'Wants to talk to a person, or describes a new project' },
        ],
        entities: [
          { name: 'company', kind: 'text', description: 'Name of the visitor company' },
          { name: 'budget', kind: 'number', description: 'Budget in rupees, if mentioned' },
          { name: 'need', kind: 'text', description: 'One-line summary of what they want built' },
        ],
        retry: 'Thanks! Let me connect you with someone from our team.',
      },
      next: {
        estimate: 'to-estimate',
        meeting: 'to-consult',
        support: 'to-support',
        person: HUMAN,
        fallback: HUMAN,
      },
    },
    { id: 'to-estimate', type: 'jump', data: { workflowKey: 'estimate' } },
    { id: 'to-consult', type: 'jump', data: { workflowKey: 'consult' } },
    { id: 'to-support', type: 'jump', data: { workflowKey: 'support' } },
    {
      id: HUMAN,
      type: 'handoff',
      data: {
        complete: true,
        agentName: AGENCY.salesAgent,
        text: 'Hi {{user.firstName}}, Aarav here from Northstar sales. I have read your note and I would love to hear more — what does success look like for you in six months?',
      },
      next: 'card',
    },
    {
      id: 'card',
      type: 'contact',
      data: {
        contact: {
          name: 'Aarav Kulkarni',
          phone: AGENCY.salesPhone,
          role: 'Head of Partnerships',
          organisation: 'Northstar Digital',
        },
      },
      next: 'office',
    },
    {
      id: 'office',
      type: 'location',
      data: {
        location: { name: AGENCY.name, address: AGENCY.address, lat: AGENCY.lat, lng: AGENCY.lng },
        caption:
          'Prefer to meet? Our studio is open Mon–Fri, 10 am – 7 pm, and the coffee is good.',
      },
      next: 'reach',
    },
    {
      id: 'reach',
      type: 'cta',
      data: {
        text: 'Or reach us directly whenever it suits you.',
        actions: [
          { kind: 'call', title: 'Call sales', phone: AGENCY.salesPhone },
          { kind: 'url', title: 'Email us', url: 'mailto:hello@northstar.example' },
        ],
      },
      next: 'bye',
    },
    { id: 'bye', type: 'end', data: { showMenu: false } },
  ],
});

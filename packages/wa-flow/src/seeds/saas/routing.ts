/**
 * Lead routing: new business → region → company size → a lead id, then the right rep —
 * enterprise first, else the regional rep, else international — with their card, a handoff
 * and call/calendar actions. Existing customers go to support, partners to partnerships.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import {
  ALL_REPS,
  COMPANY,
  ENTERPRISE_REP,
  INTERNATIONAL_REP,
  PARTNER_AGENT,
  REGIONAL_REPS,
  SUPPORT_AGENT,
  type Rep,
} from './data';

const REGION_ROWS = [...REGIONAL_REPS, INTERNATIONAL_REP];

/** A rep's card, the handoff to them, their call/booking actions and the end. */
function repNodes(rep: Rep): AuthorNode[] {
  const key = rep.region;
  return [
    {
      id: `card-${key}`,
      type: 'contact',
      data: {
        set: {
          repName: rep.name,
          repFirst: rep.name.split(' ')[0],
          repRole: rep.role,
          repCity: rep.city,
        },
        contact: { name: rep.name, phone: rep.phone, role: rep.role, organisation: 'Orbitly' },
      },
      next: `hand-${key}`,
    },
    {
      id: `hand-${key}`,
      type: 'handoff',
      data: {
        complete: true,
        agentName: rep.agentName,
        text: "Hi {{user.firstName}}, I'm {{repName}}, {{repRole}}, based in {{repCity}}. I have your lead {{leadId}} ({{segment}}, {{regionName}}) in front of me. What would you like to achieve in the next 90 days?",
      },
      next: `act-${key}`,
    },
    {
      id: `act-${key}`,
      type: 'cta',
      data: {
        text: 'Prefer a call? Ring me directly, or see our pricing while we chat.',
        actions: [
          { kind: 'call', title: 'Call {{repFirst}}', phone: rep.phone },
          { kind: 'url', title: 'See pricing', url: COMPANY.pricing },
        ],
      },
      next: `end-${key}`,
    },
    {
      id: `end-${key}`,
      type: 'end',
      data: { showMenu: true },
    },
  ];
}

export const routing = defineWorkflow({
  key: 'routing',
  name: 'Talk to a specialist',
  description: 'Get connected to the right sales rep or support',
  keywords: ['talk to someone', 'agent', 'human', 'sales rep', 'call me', 'specialist'],
  nodes: [
    {
      id: 'entry',
      type: 'condition',
      data: {
        note: 'A lead qualified in "Talk to sales" goes straight to the region question.',
        cases: [{ id: 'qualified', var: 'fromQualify', op: 'eq', value: 'yes' }],
      },
      next: { qualified: 'region', else: 'kind' },
    },
    {
      id: 'kind',
      type: 'buttons',
      data: {
        text: 'Who would you like to talk to, {{user.firstName}}?',
        buttons: [
          { id: 'new', title: 'Sales' },
          { id: 'customer', title: 'Support' },
          { id: 'partner', title: 'Partnerships' },
        ],
      },
      next: { new: 'region', customer: 'support', partner: 'partner' },
    },
    {
      id: 'region',
      type: 'list',
      data: {
        set: { fromQualify: '' },
        text: 'Where is your team based? We will connect you with a rep who knows your market.',
        button: 'Choose region',
        sections: [
          {
            id: 'regions',
            title: 'Regions',
            rows: REGION_ROWS.map((rep) => ({
              id: rep.region,
              title: rep.regionName,
              description: rep.description,
              set: { region: rep.region, regionName: rep.regionName },
            })),
          },
        ],
      },
      next: Object.fromEntries(REGION_ROWS.map((rep) => [rep.region, 'segment'])),
    },
    {
      id: 'segment',
      type: 'buttons',
      data: {
        text: 'And how many people work at your company?',
        buttons: [
          { id: 'startup', title: 'Under 50', set: { segment: 'Startup', size: 'Under 50' } },
          { id: 'mid', title: '50–500', set: { segment: 'Mid-market', size: '50–500' } },
          { id: 'ent', title: '500+', set: { segment: 'Enterprise', size: '500+' } },
        ],
      },
      next: { startup: 'lead', mid: 'lead', ent: 'lead' },
    },
    {
      id: 'lead',
      type: 'notice',
      data: {
        set: { leadId: '$id:LD' },
        text: 'Lead {{leadId}} created · {{regionName}} · {{size}} employees',
      },
      next: 'route',
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        note: 'Enterprise goes to the enterprise team in any region; else by region; else international.',
        cases: [
          { id: ENTERPRISE_REP.region, var: 'segment', op: 'eq', value: 'enterprise' },
          ...REGIONAL_REPS.map((rep) => ({
            id: rep.region,
            var: 'region',
            op: 'eq' as const,
            value: rep.region,
          })),
        ],
      },
      next: {
        ...Object.fromEntries(
          [ENTERPRISE_REP, ...REGIONAL_REPS].map((rep) => [rep.region, `card-${rep.region}`]),
        ),
        else: `card-${INTERNATIONAL_REP.region}`,
      },
    },
    ...ALL_REPS.flatMap(repNodes),
    {
      id: 'support',
      type: 'handoff',
      data: {
        agentName: SUPPORT_AGENT.agentName,
        text: "Hi {{user.firstName}}, I'm Neha from Orbitly Support. Tell me what's not working — a screenshot helps. You can also check live system status below.",
      },
      next: 'support-cta',
    },
    {
      id: 'support-cta',
      type: 'cta',
      data: {
        text: 'Urgent? Call the support line (24×5), or check whether there is a known incident.',
        actions: [
          { kind: 'call', title: 'Call support', phone: SUPPORT_AGENT.phone },
          { kind: 'url', title: 'System status', url: COMPANY.status },
        ],
      },
      next: 'support-end',
    },
    {
      id: 'support-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'partner',
      type: 'handoff',
      data: {
        agentName: PARTNER_AGENT.agentName,
        text: "Hi {{user.firstName}}, I'm Arvind from Partnerships. Are you a reseller, an implementation partner or building an integration?",
      },
      next: 'partner-card',
    },
    {
      id: 'partner-card',
      type: 'contact',
      data: {
        contact: {
          name: PARTNER_AGENT.name,
          phone: PARTNER_AGENT.phone,
          role: PARTNER_AGENT.role,
          organisation: 'Orbitly',
        },
      },
      next: 'partner-end',
    },
    {
      id: 'partner-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});

/**
 * Free gym trial: branch → goal → when, read by `ai` ("kal subah 7 baje") with a day/slot
 * picker as fallback → who is coming → QR trial pass → the branch's map pin → what to bring
 * → a push after the visit: join (jumps to plans), talk to us, or not now.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { BRANCHES, GOALS, MEMBERSHIP_DESK, type Branch } from './data';

const DAY = 'day';
const WHO = 'who';
const PASS = 'pass';
const BRING = 'bring';
const [FIRST_BRANCH, ...OTHER_BRANCHES] = BRANCHES;

function branchPin(branch: Branch): AuthorNode {
  return {
    id: `pin-${branch.id}`,
    type: 'location',
    data: {
      location: { name: branch.name, address: branch.address, lat: branch.lat, lng: branch.lng },
      caption: 'Ask for the trial desk at reception. Free parking for members and trial guests.',
    },
    next: BRING,
  };
}

export const gymTrial = defineWorkflow({
  key: 'gym-trial',
  name: 'Free gym trial',
  description: 'A free 1-day pass at any FitNation branch',
  keywords: ['trial', 'free trial', 'gym', 'visit', 'try the gym', 'day pass'],
  nodes: [
    {
      id: 'branch',
      type: 'list',
      data: {
        header: 'Free trial',
        text: 'Hi {{user.firstName}}! Your first day at FitNation is on us — full gym access, a group class and a body-composition scan. Which branch suits you?',
        footer: 'All branches in Mumbai and Navi Mumbai',
        button: 'Choose branch',
        sections: [
          {
            id: 'branches',
            title: 'Branches',
            rows: BRANCHES.map((b) => ({
              id: b.id,
              title: b.name.replace('FitNation ', ''),
              description: b.area,
              set: { branch: b.name, branchId: b.id },
            })),
          },
        ],
      },
      next: Object.fromEntries(BRANCHES.map((b) => [b.id, 'goal'])),
    },
    {
      id: 'goal',
      type: 'list',
      data: {
        text: 'What is your main goal? Your trial coach will plan the session around it.',
        button: 'Choose goal',
        sections: [
          {
            id: 'goals',
            title: 'Goals',
            rows: GOALS.map((g) => ({ ...g, set: { goal: g.title } })),
          },
        ],
      },
      next: Object.fromEntries(GOALS.map((g) => [g.id, 'when'])),
    },
    {
      id: 'when',
      type: 'ai',
      data: {
        set: { visitAtMs: '' },
        prompt:
          'When would you like to come? Type it your way — e.g. "kal subah 7 baje" or "Saturday evening 6".',
        intents: [
          { id: 'time', description: 'The customer gives a day and/or time for the visit' },
          { id: 'today', description: 'Today, as soon as possible, or right now' },
        ],
        entities: [{ name: 'visitAt', kind: 'datetime', description: 'When they will visit' }],
        retry: "Sorry, I couldn't read a time from that. Please pick one below.",
      },
      next: { time: 'has-time', today: 'has-time', fallback: DAY },
    },
    {
      id: 'has-time',
      type: 'condition',
      data: { cases: [{ id: 'yes', var: 'visitAtMs', op: 'notEmpty' }] },
      next: { yes: 'time-ok', else: DAY },
    },
    {
      id: 'time-ok',
      type: 'text',
      data: {
        set: { slot: '{{visitAtMs}}', dayLabel: '{{visitAtMs|day}}' },
        text: 'Perfect — {{dayLabel}} at {{slot|time}} at {{branch}}.',
      },
      next: WHO,
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day would you like your trial at {{branch}}?',
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
        text: 'Trial slots on {{dayLabel}}. Early mornings and late evenings are the busiest.',
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
          to: 21,
          stepMin: 60,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: WHO, 'other-day': DAY },
    },
    {
      id: WHO,
      type: 'buttons',
      data: {
        text: 'Who is the pass for?',
        buttons: [
          {
            id: 'me',
            title: 'Me',
            set: { guestName: '{{user.fullName}}', guestPhone: '{{user.phone}}' },
          },
          { id: 'friend', title: 'A friend' },
        ],
      },
      next: { me: 'own-phone', friend: 'g-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: { cases: [{ id: 'missing', var: 'guestPhone', op: 'empty' }] },
      next: { missing: 'ask-phone', else: PASS },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Your mobile number, please? The trial desk will call if anything changes.',
        var: 'guestPhone',
        kind: 'phone',
      },
      next: PASS,
    },
    {
      id: 'g-name',
      type: 'input',
      data: { prompt: "Your friend's full name?", var: 'guestName', kind: 'name' },
      next: 'g-phone',
    },
    {
      id: 'g-phone',
      type: 'input',
      data: { prompt: "And {{guestName}}'s mobile number?", var: 'guestPhone', kind: 'phone' },
      next: PASS,
    },
    {
      id: PASS,
      type: 'ticket',
      data: {
        set: { trialId: '$id:FT' },
        complete: true,
        ticket: {
          ticketId: '{{trialId}}',
          title: 'Free trial pass',
          subtitle: '{{branch}}',
          fields: [
            { label: 'Guest', value: '{{guestName}}' },
            { label: 'Mobile', value: '{{guestPhone}}' },
            { label: 'Goal', value: '{{goal}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Includes', value: 'Gym, 1 class, body scan' },
          ],
          qrData: 'fitnation://trial/{{trialId}}?slot={{slot}}',
        },
        caption: 'Scan this QR at the turnstile. Valid once, on the day booked.',
      },
      next: 'where',
    },
    {
      id: 'where',
      type: 'condition',
      data: {
        cases: OTHER_BRANCHES.map((b) => ({
          id: b.id,
          var: 'branchId',
          op: 'eq' as const,
          value: b.id,
        })),
      },
      next: {
        ...Object.fromEntries(OTHER_BRANCHES.map((b) => [b.id, `pin-${b.id}`])),
        else: `pin-${FIRST_BRANCH.id}`,
      },
    },
    ...BRANCHES.map(branchPin),
    {
      id: BRING,
      type: 'text',
      data: {
        text: 'What to bring:\n• Sports shoes and comfortable clothes\n• A water bottle and a small towel\n• A photo ID\nEat light at least an hour before. Lockers and showers are free.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'How was your trial?',
        note: 'Real use: the evening after the visit.',
      },
      next: { next: 'booked', later: 'after' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'See you at {{branch}}, {{user.firstName}}! Type *menu* any time.',
        showMenu: true,
      },
    },
    {
      id: 'after',
      type: 'buttons',
      data: {
        header: 'How was your trial?',
        text: 'Hope you enjoyed {{branch}}, {{user.firstName}}! Join within 48 hours of your trial and get an extra month free on any plan of 6 months or more.',
        buttons: [
          { id: 'join', title: 'See plans' },
          { id: 'talk', title: 'Talk to us' },
          { id: 'later', title: 'Not now' },
        ],
      },
      next: { join: 'to-plans', talk: 'desk', later: 'later' },
    },
    { id: 'to-plans', type: 'jump', data: { workflowKey: 'membership-renewal' } },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: MEMBERSHIP_DESK.agentName,
        text: 'Hi {{user.firstName}}, Nikita from the membership desk. Happy to help you pick a plan for {{goal}} — would you like a quick call?',
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
    {
      id: 'later',
      type: 'end',
      data: { text: 'No problem. Your trial offer stays open for 48 hours.', showMenu: true },
    },
  ],
});

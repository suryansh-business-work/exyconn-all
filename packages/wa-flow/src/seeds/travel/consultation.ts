/**
 * Travel consultation: video, phone or office → a specialist (or chat with the desk now) →
 * day → slot → topic → review → QR confirmation, calendar + join/call buttons, the office pin
 * for walk-ins, and a reminder push with reschedule and cancel.
 */
import { defineWorkflow } from '../../author';
import { AGENCY, CONSULTANTS, TRIP_DESK, type Consultant } from './data';

const TOPICS = [
  { id: 'new-trip', title: 'Plan a new trip', description: 'Ideas, routes, hotels and budgets' },
  { id: 'visa', title: 'Visa and passport', description: 'Documents, appointments and timelines' },
  { id: 'change', title: 'Change a booking', description: 'Dates, hotels, travellers or add-ons' },
  {
    id: 'group',
    title: 'Group or corporate',
    description: 'Offsites, MICE, school and family groups',
  },
] as const;

function consultantRow(c: Consultant) {
  return {
    id: c.id,
    title: c.name,
    description: `${c.focus} · ${c.years} yrs`,
    set: { expert: c.name, expertFocus: c.focus, expertLangs: c.languages },
  };
}

const slotList = (id: string, text: string, pick: string, back: string) => ({
  id,
  type: 'list' as const,
  data: {
    text,
    button: 'Choose time',
    sections: [
      { id: 'more', title: 'More options', rows: [{ id: 'other-day', title: 'Pick another day' }] },
    ],
    dynamic: {
      kind: 'slots' as const,
      dayVar: 'day',
      from: 10,
      to: 19,
      stepMin: 30,
      take: 8,
      var: 'slot',
    },
  },
  next: { pick, 'other-day': back },
});

const dayList = (id: string, text: string, slot: string) => ({
  id,
  type: 'list' as const,
  data: {
    text,
    button: 'Choose day',
    sections: [],
    dynamic: { kind: 'days' as const, count: 6, skipSundays: true, var: 'day' },
  },
  next: { pick: slot },
});

export const consultation = defineWorkflow({
  key: 'consultation',
  name: 'Talk to an expert',
  description: 'Free 20-minute call, video chat or office visit',
  keywords: ['expert', 'consultant', 'consultation', 'advice', 'visa help', 'call me', 'agent'],
  nodes: [
    {
      id: 'mode',
      type: 'buttons',
      data: {
        header: 'Free travel consultation',
        text: 'Hi {{user.firstName}}, our specialists have planned 40,000+ holidays. How would you like to meet?',
        footer: 'Mon–Sat, 10 am – 7 pm IST',
        buttons: [
          { id: 'video', title: 'Video call', set: { mode: 'video', modeLabel: 'Video call' } },
          { id: 'phone', title: 'Phone call', set: { mode: 'phone', modeLabel: 'Phone call' } },
          {
            id: 'office',
            title: 'Visit our office',
            set: { mode: 'office', modeLabel: 'Office visit, Andheri' },
          },
        ],
      },
      next: { video: 'expert', phone: 'expert', office: 'expert' },
    },
    {
      id: 'expert',
      type: 'list',
      data: {
        text: 'Who would you like to speak to?',
        button: 'Choose expert',
        sections: [
          { id: 'specialists', title: 'Specialists', rows: CONSULTANTS.map(consultantRow) },
          {
            id: 'now',
            title: 'Right now',
            rows: [
              {
                id: 'now',
                title: 'Chat with the desk now',
                description: 'A consultant joins this chat in minutes',
              },
            ],
          },
        ],
      },
      next: { ...Object.fromEntries(CONSULTANTS.map((c) => [c.id, 'profile'])), now: 'desk' },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: TRIP_DESK.agentName,
        text: 'Hi {{user.firstName}}, I’m Sana from the TrailNest trip desk. Tell me where you are thinking of going and I will take it from there.',
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
    {
      id: 'profile',
      type: 'image',
      data: {
        image: {
          icon: 'person',
          accent: 'indigo',
          title: '{{expert}}',
          subtitle: '{{expertFocus}}',
        },
        caption: '{{expert}} specialises in {{expertFocus}} and speaks {{expertLangs}}.',
      },
      next: 'day',
    },
    dayList('day', 'Which day suits you for your {{modeLabel}} with {{expert}}?', 'slot'),
    slotList('slot', 'Free 20-minute slots on {{dayLabel}} (IST):', 'topic', 'day'),
    {
      id: 'topic',
      type: 'list',
      data: {
        text: 'What would you like to discuss? It helps {{expert}} prepare.',
        button: 'Topic',
        sections: [
          {
            id: 'topics',
            title: 'Topics',
            rows: [
              ...TOPICS.map((t) => ({ ...t, set: { topic: t.title } })),
              { id: 'other', title: 'Something else', description: 'Type it in your own words' },
            ],
          },
        ],
      },
      next: {
        ...Object.fromEntries(TOPICS.map((t) => [t.id, 'phone-check'])),
        other: 'topic-text',
      },
    },
    {
      id: 'topic-text',
      type: 'input',
      data: {
        prompt: 'Tell us briefly what you would like to discuss.',
        var: 'topic',
        kind: 'text',
      },
      next: 'phone-check',
    },
    {
      id: 'phone-check',
      type: 'condition',
      data: {
        set: { contactPhone: '{{user.phone}}' },
        cases: [{ id: 'missing', var: 'contactPhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: 'review' },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should {{expert}} reach you on?',
        var: 'contactPhone',
        kind: 'phone',
      },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your consultation',
        text: '*Name:* {{user.fullName}}\n*Mobile:* {{contactPhone}}\n*Expert:* {{expert}}\n*How:* {{modeLabel}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Topic:* {{topic}}',
        footer: 'Free · reschedule any time',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
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
        set: { consultId: '$id:CN' },
        ticket: {
          ticketId: '{{consultId}}',
          title: 'Consultation booked',
          subtitle: '{{modeLabel}} · TrailNest Holidays',
          fields: [
            { label: 'Name', value: '{{user.fullName}}' },
            { label: 'Expert', value: '{{expert}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Topic', value: '{{topic}}' },
          ],
          qrData: 'trailnest://consult/{{consultId}}?slot={{slot}}',
        },
        caption: 'See you then, {{user.firstName}}.',
      },
      next: 'by-mode',
    },
    {
      id: 'by-mode',
      type: 'condition',
      data: {
        cases: [
          { id: 'video', var: 'mode', op: 'eq', value: 'video' },
          { id: 'office', var: 'mode', op: 'eq', value: 'office' },
        ],
      },
      next: { video: 'cta-video', office: 'cta-office', else: 'cta-phone' },
    },
    {
      id: 'cta-video',
      type: 'cta',
      data: {
        text: 'Join from your phone or laptop at the time — no app needed.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'TrailNest video call — {{expert}}',
              start: '{{slot}}',
              durationMin: 20,
              location: AGENCY.videoCall,
            },
          },
          { kind: 'url', title: 'Join video call', url: AGENCY.videoCall },
        ],
      },
      next: 'remind',
    },
    {
      id: 'cta-phone',
      type: 'cta',
      data: {
        text: '{{expert}} will call you on {{contactPhone}}. Save our number so you recognise the call.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: { title: 'TrailNest call — {{expert}}', start: '{{slot}}', durationMin: 20 },
          },
          { kind: 'call', title: 'Call TrailNest', phone: AGENCY.phone },
        ],
      },
      next: 'remind',
    },
    {
      id: 'cta-office',
      type: 'cta',
      data: {
        text: 'Ask for {{expert}} at reception on the 4th floor.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'TrailNest visit — {{expert}}',
              start: '{{slot}}',
              durationMin: 30,
              location: AGENCY.address,
            },
          },
          { kind: 'call', title: 'Call office', phone: AGENCY.phone },
        ],
      },
      next: 'pin',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: AGENCY.name, address: AGENCY.address, lat: AGENCY.lat, lng: AGENCY.lng },
        caption: '5 minutes from Chakala metro station. Visitor parking in the basement.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Consultation reminder',
        note: 'Real use: an hour before. Short for the demo.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'All set. We will remind you before the call, {{user.firstName}}.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Consultation reminder',
        text: 'Your {{modeLabel}} with {{expert}} is at {{slot|time}} on {{dayLabel}}.\nReference {{consultId}}. Keep your travel dates and passport details handy.',
        buttons: [
          { id: 'ok', title: 'I’ll be there' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { ok: 'r-ok', reschedule: 're-day', cancel: 'r-cancel' },
    },
    { id: 'r-ok', type: 'end', data: { text: 'Great, see you at {{slot|time}}.', showMenu: true } },
    dayList('re-day', 'No problem. Pick a new day with {{expert}}.', 're-slot'),
    slotList('re-slot', 'Free slots on {{dayLabel}}:', 're-ticket', 're-day'),
    {
      id: 're-ticket',
      type: 'ticket',
      data: {
        ticket: {
          ticketId: '{{consultId}}',
          title: 'Consultation moved',
          subtitle: '{{modeLabel}} · TrailNest Holidays',
          fields: [
            { label: 'Expert', value: '{{expert}}' },
            { label: 'New date', value: '{{dayLabel}}' },
            { label: 'New time', value: '{{slot|time}}' },
          ],
          qrData: 'trailnest://consult/{{consultId}}?slot={{slot}}',
        },
        caption: 'Updated — the earlier time is released.',
      },
      next: 're-done',
    },
    { id: 're-done', type: 'end', data: { text: 'Done. Anything else?', showMenu: true } },
    {
      id: 'r-cancel',
      type: 'end',
      data: {
        text: 'Your consultation {{consultId}} is cancelled. Book again from the menu whenever you like.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'Nothing was booked. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});

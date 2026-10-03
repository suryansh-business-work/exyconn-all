/**
 * Follow-up after a procedure: the procedure (carried over from an aesthetic booking, or
 * picked) → aftercare plan PDF → "how is it healing?" → healing well: rating, review and the
 * next session; some discomfort: what is normal, a day-3 check-in push; worried: free text
 * read by an `ai` node (fallback: a red-flag checklist) → the doctor on call, or reassurance.
 */
import { defineWorkflow } from '../../author';
import { CLINIC, DOCTOR_ON_CALL, FRONT_DESK, PROCEDURES } from './data';

const PLAN = 'plan';
const HOW = 'how';
const NORMAL = 'normal';
const RED_FLAGS = 'red-flags';
const URGENT = 'urgent';
const DESCRIBE = 'describe';
const RATE = 'rate';

export const aftercare = defineWorkflow({
  key: 'aftercare',
  name: 'Aftercare check-in',
  description: 'Healing tips and a doctor after your procedure',
  keywords: ['aftercare', 'after care', 'redness', 'swelling', 'healing', 'side effect', 'peeling'],
  nodes: [
    {
      id: 'has-procedure',
      type: 'condition',
      data: {
        note: 'An aesthetic booking in this chat already set the procedure; otherwise ask.',
        cases: [{ id: 'none', var: 'procKey', op: 'empty' }],
      },
      next: { none: 'pick', else: PLAN },
    },
    {
      id: 'pick',
      type: 'list',
      data: {
        header: 'Aftercare check-in',
        text: 'Hi {{user.firstName}}, which procedure did you have at Aura?',
        button: 'Procedures',
        sections: [
          {
            id: 'procedures',
            title: 'Skin and dental',
            rows: PROCEDURES.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              set: { procedure: p.title, procKey: p.id, normal: p.normal, aftercare: p.aftercare },
            })),
          },
        ],
      },
      next: Object.fromEntries(PROCEDURES.map((p) => [p.id, PLAN])),
    },
    {
      id: PLAN,
      type: 'document',
      data: {
        set: { planId: '$id:ACP', doneOn: '$days:-1' },
        document: {
          fileName: 'Aura_Aftercare_Plan.pdf',
          fileType: 'PDF',
          pages: 1,
          sizeKb: 124,
          preview: {
            title: 'Your aftercare plan',
            subtitle: '{{procedure}}',
            sections: [
              {
                kind: 'fields',
                heading: 'Patient',
                fields: [
                  { label: 'Name', value: '{{user.fullName}}' },
                  { label: 'Procedure', value: '{{procedure}}' },
                  { label: 'Done on', value: '{{doneOn|date}}' },
                  { label: 'Plan ID', value: '{{planId}}' },
                ],
              },
              { kind: 'text', heading: 'Do this', text: '{{aftercare}}' },
              { kind: 'text', heading: 'Normal for a few days', text: 'Expect {{normal}}.' },
              {
                kind: 'text',
                heading: 'Call us at once if',
                text: '• Blisters, crusting or pus\n• Redness or swelling that keeps spreading\n• Swelling of the eyes, lips or throat\n• Fever above 100°F\n• Bleeding that does not stop after an hour',
              },
            ],
            footer: `Doctor on call: ${DOCTOR_ON_CALL.phone}`,
          },
        },
        caption:
          'Here is your aftercare plan for {{procedure}}. Keep it handy for the next few days.',
      },
      next: HOW,
    },
    {
      id: HOW,
      type: 'buttons',
      data: {
        header: 'How is it healing?',
        text: 'How are you feeling after your {{procedure}}, {{user.firstName}}?',
        footer: 'Your answers go to your Aura doctor',
        buttons: [
          { id: 'well', title: 'Healing well' },
          { id: 'discomfort', title: 'Some discomfort' },
          { id: 'worried', title: 'I am worried' },
        ],
      },
      next: { well: RATE, discomfort: NORMAL, worried: DESCRIBE },
    },
    {
      id: NORMAL,
      type: 'image',
      data: {
        image: {
          icon: 'spa',
          accent: 'pink',
          title: 'This is usually normal',
          subtitle: '{{procedure}}',
        },
        caption:
          'After {{procedure}} it is common to have {{normal}}. Keep following your plan:\n{{aftercare}}',
      },
      next: 'care',
    },
    {
      id: 'care',
      type: 'buttons',
      data: {
        text: 'Shall we check on you again in a couple of days?',
        buttons: [
          { id: 'remind', title: 'Yes, check on me' },
          { id: 'describe', title: 'Describe it' },
          { id: 'fine', title: 'I’m fine, thanks' },
        ],
      },
      next: { remind: 'day3', describe: DESCRIBE, fine: 'care-end' },
    },
    {
      id: 'day3',
      type: 'reminder',
      data: { afterMs: 15_000, label: 'Day-3 check-in', note: 'Real use: three days later.' },
      next: { next: 'day3-set', later: 'day3-msg' },
    },
    {
      id: 'day3-set',
      type: 'end',
      data: {
        complete: true,
        text: 'Done — we will message you here in a couple of days.',
        showMenu: true,
      },
    },
    {
      id: 'day3-msg',
      type: 'buttons',
      data: {
        header: 'Day-3 check-in',
        text: 'Hi {{user.firstName}}, it has been a few days since your {{procedure}}. How is your skin now?',
        buttons: [
          { id: 'better', title: 'Much better' },
          { id: 'same', title: 'About the same' },
          { id: 'worse', title: 'Getting worse' },
        ],
      },
      next: { better: RATE, same: 'doctor', worse: RED_FLAGS },
    },
    {
      id: 'care-end',
      type: 'end',
      data: {
        text: 'Okay. If anything changes, type *aftercare* and we will pick it up from here.',
        showMenu: true,
      },
    },
    {
      id: DESCRIBE,
      type: 'ai',
      data: {
        prompt:
          'Tell us in your own words what you are noticing — for example "small blisters on my cheek since this morning" or "jaw still swollen, a bit of fever".',
        intents: [
          {
            id: 'red_flag',
            description:
              'Blisters, pus, spreading redness, swelling of eyes, lips or throat, fever, bleeding that will not stop, or severe pain',
          },
          {
            id: 'expected',
            description: 'Mild redness, peeling, tightness, small bumps or soreness that is easing',
          },
          {
            id: 'question',
            description: 'A question about make-up, products, the gym, food or the next session',
          },
        ],
        entities: [
          { name: 'symptom', kind: 'text', description: 'The main thing noticed, in a few words' },
          {
            name: 'since_when',
            kind: 'text',
            description: 'When it started, e.g. "since last night"',
          },
          { name: 'temperature', kind: 'number', description: 'Body temperature in °F, if given' },
        ],
        retry: 'Sorry, I could not quite follow that.',
      },
      next: { red_flag: URGENT, expected: 'fever', question: 'desk', fallback: RED_FLAGS },
    },
    {
      id: 'fever',
      type: 'condition',
      data: {
        note: 'A fever turns "expected" into urgent.',
        cases: [{ id: 'high', var: 'temperature', op: 'gt', value: '100' }],
      },
      next: { high: URGENT, else: NORMAL },
    },
    {
      id: RED_FLAGS,
      type: 'buttons',
      data: {
        text: 'Do you have any of these right now?\n• Blisters, crusting or pus\n• Redness or swelling that keeps spreading\n• Swelling of the eyes, lips or throat\n• Fever above 100°F\n• Bleeding that does not stop',
        buttons: [
          { id: 'yes', title: 'Yes, one of these' },
          { id: 'no', title: 'No' },
        ],
      },
      next: { yes: URGENT, no: NORMAL },
    },
    {
      id: URGENT,
      type: 'cta',
      data: {
        header: 'Let a doctor see this today',
        text: 'Please do not apply anything new to the area. Call the doctor on call now — if your lips, eyes or throat are swelling, or you find it hard to breathe, go to the nearest emergency department.',
        actions: [
          { kind: 'call', title: 'Call doctor on call', phone: DOCTOR_ON_CALL.phone },
          { kind: 'call', title: 'Call the clinic', phone: CLINIC.urgent },
        ],
      },
      next: 'doctor',
    },
    {
      id: 'doctor',
      type: 'handoff',
      data: {
        complete: true,
        agentName: DOCTOR_ON_CALL.agentName,
        text: 'Hi {{user.firstName}}, Dr. Meghna here. I have your notes for {{procedure}}. Could you send me a clear photo of the area in daylight? I will tell you whether to come in today.',
      },
      next: 'doctor-card',
    },
    {
      id: 'doctor-card',
      type: 'contact',
      data: {
        contact: {
          name: DOCTOR_ON_CALL.name,
          phone: DOCTOR_ON_CALL.phone,
          role: DOCTOR_ON_CALL.role,
          organisation: 'Aura Skin & Smile Clinic',
        },
      },
      next: 'doctor-end',
    },
    {
      id: 'doctor-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: FRONT_DESK.agentName,
        text: 'Hi {{user.firstName}}, Rhea from Aura. I have your question about {{procedure}} and will check with your doctor if needed — one moment.',
      },
      next: 'doctor-end',
    },
    {
      id: RATE,
      type: 'buttons',
      data: {
        text: 'Lovely to hear, {{user.firstName}}! How was your {{procedure}} experience at Aura?',
        buttons: [
          { id: 'excellent', title: 'Excellent', set: { rating: '5' } },
          { id: 'good', title: 'Good', set: { rating: '4' } },
          { id: 'poor', title: 'Could be better', set: { rating: '2' } },
        ],
      },
      next: { excellent: 'review', good: 'review', poor: 'poor' },
    },
    {
      id: 'review',
      type: 'cta',
      data: {
        complete: true,
        text: 'Thank you! Would you leave a quick review? It helps others choose the right clinic.',
        actions: [{ kind: 'url', title: 'Write a review', url: CLINIC.review }],
      },
      next: 'kind',
    },
    {
      id: 'kind',
      type: 'condition',
      data: {
        note: 'Dental procedures have a planned review visit; skin ones offer the next session.',
        cases: [
          { id: 'rct', var: 'procKey', op: 'eq', value: 'rct' },
          { id: 'extraction', var: 'procKey', op: 'eq', value: 'extraction' },
        ],
      },
      next: { rct: 'dental-bye', extraction: 'dental-bye', else: 'next-session' },
    },
    {
      id: 'dental-bye',
      type: 'end',
      data: {
        text: 'Your dentist will see you at the review visit already on your plan. Take care, {{user.firstName}}.',
        showMenu: true,
      },
    },
    {
      id: 'next-session',
      type: 'buttons',
      data: {
        text: 'Results build up over sessions. Would you like to book your next one?',
        buttons: [
          { id: 'book', title: 'Book next session' },
          { id: 'later', title: 'Maybe later' },
        ],
      },
      next: { book: 'to-book', later: 'bye' },
    },
    {
      id: 'to-book',
      type: 'jump',
      data: { workflowKey: 'aesthetic' },
    },
    {
      id: 'bye',
      type: 'end',
      data: { text: 'Take care of that glow, {{user.firstName}}.', showMenu: true },
    },
    {
      id: 'poor',
      type: 'input',
      data: {
        prompt: 'We are sorry. What could we have done better?',
        var: 'feedback',
        kind: 'text',
      },
      next: 'poor-ack',
    },
    {
      id: 'poor-ack',
      type: 'end',
      data: {
        set: { feedbackId: '$id:FB' },
        text: 'Thank you for telling us. Reference {{feedbackId}} is with our clinic manager, who will call you within 24 hours.',
        showMenu: true,
      },
    },
  ],
});

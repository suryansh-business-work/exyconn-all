/**
 * Post-visit check-in: Better → rating → review link; Same → medicine advice and a daily
 * reminder; Worse → red-flag check → emergency or the duty doctor. Free text goes through an
 * `ai` node (intents + entities) whose fallback re-asks with buttons.
 */
import { defineWorkflow } from '../../author';
import { DUTY_DOCTOR, HOSPITAL } from './data';

const ASK = 'ask';
const RED_FLAGS = 'red-flags';
const DUTY = 'duty';
const EMERGENCY = 'er';
const MEDS = 'meds';
const RATE = 'rate';

export const followUp = defineWorkflow({
  key: 'follow-up',
  name: 'Post-visit check-in',
  description: 'Tell us how you feel after your visit',
  keywords: ['follow up', 'follow-up', 'check in', 'feeling', 'recovery', 'side effect'],
  nodes: [
    {
      id: 'has-doctor',
      type: 'condition',
      data: {
        note: 'Reuse the doctor from an appointment booked in this chat; otherwise pick one.',
        cases: [{ id: 'none', var: 'doctor', op: 'empty' }],
      },
      next: { none: 'seed-doctor', else: ASK },
    },
    {
      id: 'seed-doctor',
      type: 'delay',
      data: {
        ms: 400,
        set: {
          doctor: '$pick:Dr. Suresh Babu|Dr. Ritu Agarwal|Dr. Imran Sheikh',
          dept: 'General Medicine',
        },
      },
      next: ASK,
    },
    {
      id: ASK,
      type: 'buttons',
      data: {
        header: 'Post-visit check-in',
        text: 'Hi {{user.firstName}}, how are you feeling after your visit with {{doctor}}?',
        footer: 'Your answers go to your care team',
        buttons: [
          { id: 'better', title: 'Better', set: { feeling: 'better' } },
          { id: 'same', title: 'Same', set: { feeling: 'same' } },
          { id: 'worse', title: 'Worse', set: { feeling: 'worse' } },
        ],
      },
      next: { better: RATE, same: MEDS, worse: RED_FLAGS },
    },
    {
      id: RED_FLAGS,
      type: 'buttons',
      data: {
        text: 'Sorry to hear that. Do you have any of these right now?\n• Chest pain or pressure\n• Difficulty breathing\n• Fever above 102°F that will not come down\n• Fainting, confusion or heavy bleeding',
        buttons: [
          { id: 'yes', title: 'Yes, one of these' },
          { id: 'no', title: 'No' },
        ],
      },
      next: { yes: EMERGENCY, no: DUTY },
    },
    {
      id: EMERGENCY,
      type: 'cta',
      data: {
        header: 'Please get help now',
        text: 'These signs need a doctor straight away. Call our 24×7 emergency line or go to the nearest emergency department. Do not drive yourself.',
        actions: [
          { kind: 'call', title: 'Call emergency', phone: HOSPITAL.emergency },
          { kind: 'url', title: 'Get directions', url: HOSPITAL.directions },
        ],
      },
      next: 'er-pin',
    },
    {
      id: 'er-pin',
      type: 'location',
      data: {
        location: {
          name: 'CityCare Emergency (24×7)',
          address: HOSPITAL.address,
          lat: HOSPITAL.lat,
          lng: HOSPITAL.lng,
        },
        caption: 'Emergency entrance on the 100 Feet Road side. Ambulance bay open all hours.',
      },
      next: 'er-end',
    },
    {
      id: 'er-end',
      type: 'end',
      data: {
        text: 'Take care, {{user.firstName}}. Message us when you are safe.',
        showMenu: true,
      },
    },
    {
      id: DUTY,
      type: 'handoff',
      data: {
        complete: true,
        agentName: DUTY_DOCTOR.agentName,
        text: "Hi {{user.firstName}}, I'm Dr. Ananya Rao, today's duty doctor. I have your notes from {{doctor}}. Tell me what has changed and since when — I will call you if it is easier to talk.",
      },
      next: 'duty-card',
    },
    {
      id: 'duty-card',
      type: 'contact',
      data: {
        contact: {
          name: DUTY_DOCTOR.name,
          phone: DUTY_DOCTOR.phone,
          role: DUTY_DOCTOR.role,
          organisation: 'CityCare Hospital',
        },
      },
      next: 'duty-cta',
    },
    {
      id: 'duty-cta',
      type: 'cta',
      data: {
        text: 'Prefer to talk? Call Dr. Rao directly, or start a video consultation.',
        actions: [
          { kind: 'call', title: 'Call duty doctor', phone: DUTY_DOCTOR.phone },
          { kind: 'url', title: 'Video consult', url: HOSPITAL.teleconsult },
        ],
      },
      next: 'duty-end',
    },
    {
      id: 'duty-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: MEDS,
      type: 'buttons',
      data: {
        text: 'Recovery can take a few days. Keep taking the medicines {{doctor}} prescribed:\n• At the same times every day\n• Finish the full course, even if you feel fine\n• Drink plenty of water and rest\nShall we send you a daily medicine reminder at 9 am?',
        buttons: [
          { id: 'remind', title: 'Yes, remind me' },
          { id: 'no', title: 'No, thanks' },
          { id: 'describe', title: 'Describe symptoms' },
        ],
      },
      next: { remind: 'med-remind', no: 'same-end', describe: 'describe' },
    },
    {
      id: 'med-remind',
      type: 'reminder',
      data: { afterMs: 15_000, label: 'Medicine reminder', note: 'Real use: daily at 9 am.' },
      next: { next: 'med-set', later: 'med-push' },
    },
    {
      id: 'med-set',
      type: 'end',
      data: {
        text: 'Done — a reminder will arrive here every morning at 9 am.',
        showMenu: true,
        complete: true,
      },
    },
    {
      id: 'med-push',
      type: 'image',
      data: {
        image: { icon: 'pill', accent: 'blue', title: 'Medicine time', subtitle: '9:00 am' },
        caption:
          'Good morning, {{user.firstName}}. Time for your morning medicines — after breakfast, with a glass of water.',
      },
      next: 'med-check',
    },
    {
      id: 'med-check',
      type: 'buttons',
      data: {
        text: 'Let us know once you have taken them.',
        buttons: [
          { id: 'taken', title: 'Taken' },
          { id: 'worse', title: 'Feeling worse' },
        ],
      },
      next: { taken: 'med-thanks', worse: RED_FLAGS },
    },
    {
      id: 'med-thanks',
      type: 'end',
      data: { text: 'Great, noted. Keep it up!', showMenu: true },
    },
    {
      id: 'same-end',
      type: 'end',
      data: {
        text: 'Okay. If anything changes, type *check in* and we will pick it up from here.',
        showMenu: true,
      },
    },
    {
      id: 'describe',
      type: 'ai',
      data: {
        prompt:
          'Tell us in your own words how you feel — for example, "fever is gone but I still have a cough since Monday".',
        intents: [
          { id: 'better', description: 'The patient feels better or has recovered' },
          { id: 'same', description: 'No real change since the visit' },
          { id: 'worse', description: 'Symptoms are worse, new or worrying' },
          {
            id: 'question',
            description: 'A question about medicines, diet, reports or the next visit',
          },
        ],
        entities: [
          {
            name: 'symptom',
            kind: 'text',
            description: 'The main symptom mentioned, in a few words',
          },
          {
            name: 'since_when',
            kind: 'text',
            description: 'When the symptom started, e.g. "since Monday"',
          },
          { name: 'temperature', kind: 'number', description: 'Body temperature in °F, if given' },
        ],
        retry: "Sorry, I couldn't quite follow that.",
      },
      next: { better: RATE, same: MEDS, worse: 'ai-worse', question: 'nurse', fallback: ASK },
    },
    {
      id: 'ai-worse',
      type: 'condition',
      data: {
        note: 'Red-flag words or a high fever go straight to emergency.',
        cases: [
          { id: 'chest', var: 'symptom', op: 'contains', value: 'chest' },
          { id: 'breath', var: 'symptom', op: 'contains', value: 'breath' },
          { id: 'fever', var: 'temperature', op: 'gt', value: '102' },
        ],
      },
      next: { chest: EMERGENCY, breath: EMERGENCY, fever: EMERGENCY, else: DUTY },
    },
    {
      id: 'nurse',
      type: 'handoff',
      data: {
        agentName: 'Sister Leena (Care team)',
        text: "Hi {{user.firstName}}, I'm Leena from the nursing team. I have your question here and your notes from {{doctor}} — give me a moment.",
      },
      next: 'nurse-end',
    },
    {
      id: 'nurse-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: RATE,
      type: 'buttons',
      data: {
        text: 'Glad to hear that, {{user.firstName}}! How was your experience with {{doctor}} and the CityCare team?',
        buttons: [
          { id: 'excellent', title: 'Excellent', set: { rating: '5' } },
          { id: 'good', title: 'Good', set: { rating: '4' } },
          { id: 'poor', title: 'Poor', set: { rating: '2' } },
        ],
      },
      next: { excellent: 'review', good: 'review', poor: 'poor' },
    },
    {
      id: 'review',
      type: 'cta',
      data: {
        complete: true,
        text: 'Thank you! Would you share a quick review? It takes a minute and helps other families choose their care.',
        actions: [{ kind: 'url', title: 'Write a review', url: HOSPITAL.review }],
      },
      next: 'review-end',
    },
    {
      id: 'review-end',
      type: 'end',
      data: { text: 'Wishing you good health, {{user.firstName}}.', showMenu: true },
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
        set: { feedbackId: '$id:PR' },
        text: 'Thank you for telling us. Reference {{feedbackId}} is with our Patient Relations team, and they will call you within 24 hours.',
        showMenu: true,
      },
    },
  ],
});

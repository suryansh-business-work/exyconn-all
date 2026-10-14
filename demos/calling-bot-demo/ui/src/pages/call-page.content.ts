import type { DemoQuestion, DemoStep } from '@exyconn/demo-visitor/page';

/** Read before pressing call: what makes the first call go well. */
export const CALL_TIPS: readonly string[] = [
  'Allow the microphone when your browser asks',
  'Use headphones so the bot does not hear itself',
  'Interrupt it any time: it stops and listens',
];

/** What businesses put the bot to work on, beside the photo. */
export const USE_CASES: readonly string[] = [
  'Answer every inbound call and qualify the lead',
  'Book, confirm and reschedule appointments',
  'Remind customers about payments and renewals',
  'Collect feedback after a visit or a delivery',
  'Hand the call to a person when it needs one',
];

/** Beside the phone-call card: what to expect when the bot rings. */
export const PHONE_CALL_TIPS: readonly string[] = [
  'Enter your mobile number with the country code',
  'Pick up as you would any call: it comes from our business number',
  'Follow the transcript here while you talk',
];

/** How to try it, in order. */
export const CALL_STEPS: readonly DemoStep[] = [
  {
    title: 'Press the green button',
    body: 'Allow the microphone when your browser asks. The bot picks up within a second or two.',
  },
  {
    title: 'Say hello',
    body: 'The bot greets you first. Answer as you would on a call with a business.',
  },
  {
    title: 'Talk naturally',
    body: 'Ask questions, change your mind or cut in mid-sentence. It stops, listens and replies.',
  },
  {
    title: 'Read it back',
    body: 'Everything said appears on the screen as you talk. Hang up with the red button when you are done.',
  },
];

/** Questions answered from the live demo's settings: `{language}` and `{minutes}`. */
export const SETTINGS_FAQ: readonly DemoQuestion[] = [
  {
    question: 'Which languages does it speak?',
    answer:
      'This demo speaks {language}. The bot can also speak English, Hindi and other Indian languages; tell us the language your customers use.',
  },
  {
    question: 'How long can a call last?',
    answer: 'Demo calls end on their own after {minutes} minutes, to keep them short.',
  },
];

/** What visitors ask about the calling bot. */
export const CALL_FAQ: readonly DemoQuestion[] = [
  {
    question: 'The bot cannot hear me. What should I check?',
    answer:
      'Make sure this page may use your microphone (the icon at the left of the address bar) and that the right microphone is selected in your computer or phone settings. Then start the call again.',
  },
  {
    question: 'Why does the bot interrupt itself or repeat?',
    answer:
      'Its own voice is reaching your microphone from the speakers. Use headphones, or turn the volume down.',
  },
  {
    question: 'Will a phone call cost me anything?',
    answer: 'No. When the bot rings your phone, the call comes from our number and we pay for it.',
  },
  {
    question: 'Is the call recorded?',
    answer:
      'Only the written transcript is saved, so our team can review the demo. The audio is not stored.',
  },
  {
    question: 'Can it work with our own systems?',
    answer:
      'Yes. In a real deployment it looks up and updates your CRM, books into your calendar and passes the call to a person when needed.',
  },
];

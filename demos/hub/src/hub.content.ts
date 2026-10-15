import type { DemoQuestion, DemoStep } from '@exyconn/demo-visitor/page';

/** How a visitor gets from this page into a demo. */
export const HUB_STEPS: readonly DemoStep[] = [
  {
    title: 'Pick a demo',
    body: 'Choose the AI calling bot or the WhatsApp automation below.',
  },
  {
    title: 'Sign in with a code',
    body: 'Enter your name and work email, then the 6-digit code we email you. One sign-in opens every demo.',
  },
  {
    title: 'Try it like a customer',
    body: 'Talk, type, interrupt and change your mind. Each demo reacts in real time.',
  },
  {
    title: 'Make it yours',
    body: 'Like what you see? We set it up with your own flows, voice, language and systems.',
  },
];

/** What prospects ask before they try a demo. */
export const HUB_FAQ: readonly DemoQuestion[] = [
  {
    question: 'Is this the real product or a recording?',
    answer:
      'It is the real product. Each demo runs live on the same platform we deploy for clients, with sample businesses in place of yours.',
  },
  {
    question: 'Why do I need to sign in?',
    answer:
      'A one-time code sent to your work email keeps the demos for real visitors. There is no password to create and nothing to install.',
  },
  {
    question: 'Does it cost anything?',
    answer: 'No. Trying the demos is free.',
  },
  {
    question: 'What happens to what I say and type?',
    answer:
      'Calls and chats are saved so our team can review how the demo went. Please do not share real personal, health or payment details while trying them.',
  },
  {
    question: 'Which devices and browsers work?',
    answer:
      'Any recent Chrome, Edge, Safari or Firefox on a laptop or phone. The calling bot needs microphone access; headphones give the best sound.',
  },
  {
    question: 'Can you build this for my business?',
    answer:
      'Yes. We tailor the conversations, the voice and language, and connect them to your CRM, calendar, payments or helpdesk.',
  },
];

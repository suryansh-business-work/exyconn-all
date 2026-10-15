import type { DemoQuestion, DemoStep } from '@exyconn/demo-visitor/page';

/** How to try the WhatsApp demo, in order. */
export const GUIDE_STEPS: readonly DemoStep[] = [
  {
    title: 'Pick a business',
    body: 'Open a chat from the list, from a clinic to a hotel. Each one is its own bot.',
  },
  {
    title: 'Tap or type',
    body: 'Use the buttons and lists the bot sends, or answer in your own words.',
  },
  {
    title: 'Go all the way',
    body: 'Book, order, pay, raise a ticket or set a reminder, just as a customer would.',
  },
  {
    title: 'Start over any time',
    body: 'Open the chat menu (⋮) and choose Clear chat to begin the conversation again.',
  },
];

/** What visitors ask about the WhatsApp demo. */
export const GUIDE_FAQ: readonly DemoQuestion[] = [
  {
    question: 'Is this the real WhatsApp?',
    answer:
      'No. This page looks like WhatsApp so you see what your customers would see. Once we set it up, the same flows run on your own WhatsApp Business number.',
  },
  {
    question: 'Are my messages sent to anyone?',
    answer:
      'No message reaches a real business or a real phone. We record how the demo is used so we can improve it.',
  },
  {
    question: 'What can I type?',
    answer:
      'Anything a customer would. The bot guides you with buttons and lists, and its AI understands free text such as dates, times and quantities.',
  },
  {
    question: 'Which industries can I try?',
    answer:
      'Clinics, restaurants, hotels, salons, retail, real estate, education and more, each with its own bot. We build new ones for your business.',
  },
  {
    question: 'Can this work on my business number?',
    answer:
      'Yes. We connect the flows to your WhatsApp Business number through the official WhatsApp Business Platform, and to your booking, payment or CRM tools.',
  },
];

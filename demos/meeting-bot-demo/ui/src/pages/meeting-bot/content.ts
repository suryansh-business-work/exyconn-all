import type { DemoQuestion, DemoStep } from '@exyconn/demo-visitor/page';

/** Beside the form: what makes the first trip go well. */
export const TRY_TIPS: readonly string[] = [
  'Start or open your Google Meet call first',
  'Admit the notetaker when it asks to join',
  'Talk for a few minutes, then end the call',
];

/** How to try it, in order. */
export const TRY_STEPS: readonly DemoStep[] = [
  {
    title: 'Open a call',
    body: 'Start a Google Meet call, alone or with colleagues, and copy its link.',
  },
  {
    title: 'Send the notetaker',
    body: 'Paste the link, agree to the recording terms and press Send. It asks to join within a minute.',
  },
  {
    title: 'Admit it and talk',
    body: 'Let it in from the call. It says hello in the chat and records while you talk.',
  },
  {
    title: 'Read the notes',
    body: 'When the call ends, the summary, decisions and action items appear here and in your inbox.',
  },
];

/** What visitors ask about the meeting bot. */
export const FAQ: readonly DemoQuestion[] = [
  {
    question: 'Does everyone in the call know it is being recorded?',
    answer:
      'The notetaker joins under its own name and announces itself in the call chat. You agree to tell everyone in the call before you send it.',
  },
  {
    question: 'What happens to the recording?',
    answer:
      'It is kept in a demo workspace of its own, only you see its notes, and the recording, transcript and notes are deleted after a few days.',
  },
  {
    question: 'Does it work with Zoom or Teams?',
    answer:
      'This demo joins Google Meet. Tell us which meeting tools your team uses and we will plan the rest with you.',
  },
  {
    question: 'Can the notes go into our CRM or project tool?',
    answer:
      'Yes. In your own workspace, action items become tasks, and notes are filed against the client the meeting was with.',
  },
];

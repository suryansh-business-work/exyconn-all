/**
 * The demo page's words (English sources; `t()` translates them where they are drawn). The
 * demo websites, their workflows and their agents come from the server's catalogue.
 */
import type { DemoQuestion, DemoStep } from '@exyconn/demo-visitor/page';

/** Beside the live chat: what to try first. */
export const TRY_TIPS: readonly string[] = [
  'Tap an option, or type the way a customer would',
  'Ask for a quote, a booking or a product — it carries the whole task through',
  'Switch between a services firm and an online store above',
];

/**
 * The shape of the snippet a client pastes. Every install gets its own agent id and script
 * address from us; this one is an example and is not served.
 */
export const SNIPPET_EXAMPLE = [
  '<!-- Exyconn AI chat agent -->',
  '<script',
  '  src="https://agent.exyconn.example/widget.js"',
  '  data-agent="YOUR-AGENT-ID"',
  '  data-accent="#1e40af"',
  '  async',
  '></script>',
].join('\n');

/** How it reaches a client's site, in order. */
export const INSTALL_STEPS: readonly DemoStep[] = [
  {
    title: 'We build your agent',
    body: 'Your services, products, prices, FAQs and policies become workflows like the ones on this page, in your tone and colours.',
  },
  {
    title: 'Paste one line',
    body: 'Add the script tag before </body>, or install it from your CMS. No developer time, no change to your site.',
  },
  {
    title: 'Connect your tools',
    body: 'Leads go to your CRM, bookings to your calendar, tickets to your helpdesk and orders to your store.',
  },
  {
    title: 'Watch it work',
    body: 'Every conversation, drop-off and completed booking shows up in your dashboard, so you can improve the flows.',
  },
];

/** How to try the demo, in order. */
export const TRY_STEPS: readonly DemoStep[] = [
  {
    title: 'Pick a website',
    body: 'A services firm or an online store. Each has its own agent and its own workflows.',
  },
  {
    title: 'Chat like a customer',
    body: 'Tap options or type freely. Ask for an estimate, book a call, find a product or track an order.',
  },
  {
    title: 'Finish a task',
    body: 'You get the real result: an estimate PDF, a booking pass, an order to pay or a support ticket.',
  },
  {
    title: 'Start any workflow',
    body: 'Every workflow below has a Try it button that starts it in the chat straight away.',
  },
];

/** What visitors ask about the website chat agent. */
export const FAQ: readonly DemoQuestion[] = [
  {
    question: 'Will it work on my website?',
    answer:
      'Yes. It is one script tag, so it works on WordPress, Shopify, Webflow, Wix, custom React or plain HTML sites. It loads after your page, so it does not slow it down.',
  },
  {
    question: 'Do I need my own OpenAI key?',
    answer:
      'No. The guided workflows run without any AI key. We connect an AI model for free-text questions as part of your setup, and you can bring your own key if you prefer.',
  },
  {
    question: 'Can it hand a chat to a person?',
    answer:
      'Yes. Any workflow can pass the chat to your team with the full conversation, on the website, on WhatsApp or in your helpdesk.',
  },
  {
    question: 'Where do the leads go?',
    answer:
      'Into your CRM, Google Sheets or email, with what the visitor asked for. Bookings go to your calendar and tickets to your helpdesk.',
  },
  {
    question: 'Which languages does it speak?',
    answer:
      'English, Hindi and the other major languages. It answers in the language the visitor writes in.',
  },
  {
    question: 'Can it take payments?',
    answer:
      'Yes. The order card in the store demo is what a payment step looks like; on your site it opens your payment gateway.',
  },
  {
    question: 'How long does it take to go live?',
    answer:
      'Usually two to three weeks: one to agree the workflows, one to build and connect them, and a few days of testing with your team.',
  },
];

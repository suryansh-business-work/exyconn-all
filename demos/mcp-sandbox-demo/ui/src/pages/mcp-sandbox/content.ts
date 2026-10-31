import type { DemoQuestion, DemoStep } from '@exyconn/demo-visitor/page';

/** Beside the token card: what the sandbox is. */
export const HIGHLIGHTS: readonly string[] = [
  'A sample company with a sales pipeline, projects and a team',
  'A token that only reads, and expires on its own',
  'The same MCP server your own Exyconn workspace gets',
];

/** How to try it, in order. */
export const TRY_STEPS: readonly DemoStep[] = [
  {
    title: 'Take a token',
    body: 'Press Get a read-only token and copy it. It is shown once and expires on its own.',
  },
  {
    title: 'Connect Claude',
    body: 'Paste the Claude Code command into a terminal, or add the config to Claude Desktop.',
  },
  {
    title: 'Ask about the company',
    body: 'Try "Which deals close this month?" or "Who is working on the fleet tracking project?"',
  },
  {
    title: 'Or stay in the browser',
    body: 'List the tools below, pick one and run it to see exactly what Claude would read.',
  },
];

/** What visitors ask about the sandbox. */
export const FAQ: readonly DemoQuestion[] = [
  {
    question: 'Is this real customer data?',
    answer:
      'No. Every company, person and deal in the sandbox is invented, and every email address is on a reserved example domain.',
  },
  {
    question: 'Can Claude change anything?',
    answer:
      'No. Sandbox tokens only read. Tools that change records are not offered, and a call to one is refused.',
  },
  {
    question: 'What happens to my token?',
    answer:
      'It expires on its own, you can revoke it here at any time, and taking or revoking one is recorded in the audit log.',
  },
  {
    question: 'How does this work for my own company?',
    answer:
      'Your workspace gets one MCP server per module and one for everything, signed in with your own account and permissions, from the MCP portal.',
  },
];

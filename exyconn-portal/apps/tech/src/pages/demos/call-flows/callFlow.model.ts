/**
 * A calling bot example as the call-flow editor works on it: its stored flow (or a starter
 * built from its greeting), and the in-memory bundle "Rehearse" plays it in as text.
 */
import { toWorkflowDef, type DemoProfile, type WaGraph } from '@exyconn/wa-flow';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import type { CallingBotScenarioFlowsQuery } from '@exyconn/shell/graphql/generated';

export type CallFlowRow = CallingBotScenarioFlowsQuery['callingBotScenarios'][number];

/** The workflow key the rehearsal runs the flow under. */
export const REHEARSAL_KEY = 'call';

/** A flow to start from: the example's greeting, then a polite close. */
export function starterFlow(row: CallFlowRow): WaGraph {
  return toWorkflowDef(
    {
      key: REHEARSAL_KEY,
      name: 'Call',
      description: '',
      keywords: [],
      nodes: [
        { id: 'greet', type: 'text', data: { text: row.greeting }, next: 'close' },
        { id: 'close', type: 'end', data: { text: 'Thank you for calling.', showMenu: false } },
      ],
    },
    0,
  ).graph;
}

/** The stored flow (the server parsed it with `graphSchema`), or a starter. */
export function flowOf(row: CallFlowRow): WaGraph {
  return (row.flow as WaGraph | null) ?? starterFlow(row);
}

/** The example as a one-workflow demo, so the website widget can play the flow as text. */
export function rehearsalBundle(row: CallFlowRow, graph: WaGraph): DemoBundle {
  const demo: DemoProfile = {
    key: `call-${row.id}`,
    channel: 'website',
    industry: 'Calling bot',
    business: {
      name: row.title,
      tagline: row.description,
      category: 'Calling bot',
      about: row.description,
      icon: 'phone',
      accent: 'teal',
      verified: true,
      phone: '',
      email: '',
      website: '',
      address: '',
      hours: '',
    },
    // The flow says the example's own greeting; the chat opens with how to rehearse instead.
    greeting: 'Call rehearsal: you are the caller. Reply the way you would on the phone.',
    menuText: 'Start the call',
    menuButton: 'Start',
    order: 0,
    active: true,
  };
  const workflow = {
    key: REHEARSAL_KEY,
    name: 'Call',
    description: '',
    keywords: [],
    order: 0,
    graph,
  };
  return { demo, workflows: [workflow] };
}

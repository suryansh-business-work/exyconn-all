import { isValidObjectId } from 'mongoose';
import {
  graphSchema,
  nonVoiceNodes,
  toCallScript,
  validateGraph,
  type WaGraph,
} from '@exyconn/wa-flow';
import type { CallingBotScenarioRecord } from '@exyconn/calling-bot-demo-server';
import { runOnce } from '../../lib/migrations';
import { badRequest, notFound } from '../../utils/errors';
import { CallingBotScenarioModel } from './calling-bot.models';
import { SCENARIO_FLOWS } from './calling-bot.flows.seed';

/** A drawn call flow, checked the way the editor checks it: voice nodes only, no errors. */
function parseFlow(flow: unknown): WaGraph {
  const parsed = graphSchema.safeParse(flow);
  if (!parsed.success) {
    badRequest('The call flow is not valid. Reload the editor and try again.');
  }
  const graph = parsed.data;
  const cards = nonVoiceNodes(graph);
  if (cards.length > 0) {
    badRequest(`A call cannot carry these steps: ${cards.join(', ')}. Remove them first.`);
  }
  const errors = validateGraph(graph).filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    badRequest(`Fix the call flow first: ${errors.map((issue) => issue.message).join(' ')}`);
  }
  return graph;
}

/**
 * Saves an example's call flow and the script compiled from it, which the voice server adds
 * to the example's prompt on its next call; null removes both.
 */
export async function saveScenarioFlow(id: string, flow: unknown) {
  if (!isValidObjectId(id)) {
    notFound('Calling bot example');
  }
  const graph = flow === null || flow === undefined ? null : parseFlow(flow);
  const doc = await CallingBotScenarioModel.findByIdAndUpdate(
    id,
    { flow: graph, callScript: graph ? toCallScript(graph) : '' },
    { new: true },
  ).lean<CallingBotScenarioRecord>();
  if (!doc) {
    notFound('Calling bot example');
  }
  return doc;
}

/**
 * Gives seeded examples their starter call flows, once each: an example that has a flow by
 * then (drawn in Tech), or that Tech deleted, is left alone.
 */
export async function ensureCallingBotFlows(): Promise<void> {
  // Each example has its own ledger line and its own row, so they are filled side by side.
  await Promise.all(
    Object.entries(SCENARIO_FLOWS).map(([key, graph]) =>
      runOnce(`calling-bot-flow:${key}`, async () => {
        await CallingBotScenarioModel.updateOne(
          { key, $or: [{ flow: null }, { flow: { $exists: false } }] },
          { flow: graph, callScript: toCallScript(graph) },
        );
      }),
    ),
  );
}

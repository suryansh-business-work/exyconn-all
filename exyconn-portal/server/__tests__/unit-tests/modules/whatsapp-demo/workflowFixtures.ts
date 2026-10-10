import { randomUUID } from 'node:crypto';
import { toDemoProfile } from '@exyconn/wa-flow';
import { SEED_DEMOS } from '@exyconn/wa-flow/seeds';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import { WhatsappDemoModel } from '../../../../src/modules/whatsapp-demo/whatsappDemo.model';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { WorkflowDraftInput } from '../../../../src/modules/whatsapp-demo/whatsappDemo.workflows';

/** Shared setup for the WhatsApp workflow suites: an admin, a demo and graphs that pass or fail. */

const position = { x: 0, y: 0 };

/** One End node: valid, and nothing in it blocks a publish. */
export const END_GRAPH = {
  start: 'end',
  nodes: [{ id: 'end', type: 'end', position, data: { showMenu: true } }],
  edges: [],
};

/** A graph that only jumps to another workflow of the demo. */
export const jumpGraph = (workflowKey: string) => ({
  start: 'go',
  nodes: [{ id: 'go', type: 'jump', position, data: { workflowKey } }],
  edges: [],
});

/** The right shape, but its start names no node: an error that blocks a publish. */
export const NO_START_GRAPH = { ...END_GRAPH, start: 'missing' };

export const draftInput = (fields: Partial<WorkflowDraftInput> = {}): WorkflowDraftInput => ({
  name: 'Book a slot',
  description: 'Pick a time',
  keywords: ['book'],
  order: 3,
  graph: END_GRAPH,
  ...fields,
});

/** A signed-in administrator with a name on file, so changes are stamped with it. */
export async function signedInAdmin(): Promise<GraphQLContext> {
  const user = await UserModel.create({
    name: 'Asha Admin',
    email: `${randomUUID()}@example.com`,
    passwordHash: randomUUID(),
    roles: [ROLES.ADMIN],
  });
  return { user: { id: user._id.toHexString(), roles: [ROLES.ADMIN], email: user.email } };
}

export async function createDemo(key = 'salon'): Promise<string> {
  const demo = await WhatsappDemoModel.create({ ...toDemoProfile(SEED_DEMOS[0], 0), key });
  return demo._id.toHexString();
}

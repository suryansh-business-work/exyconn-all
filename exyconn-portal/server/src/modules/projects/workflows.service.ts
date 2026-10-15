import { ProjectWorkflowModel } from './workflows.model';
import { workflowGraphProblem, workflowGraphSchema } from './workflows.validation';
import type { Actor } from './board.service';
import { badRequest, notFound } from '../../utils/errors';

const MAX_NAME = 120;
const MAX_DESCRIPTION = 1000;

/** A workflow's name and what it is for — everything about it except the drawing. */
export interface WorkflowDetailsInput {
  name: string;
  description?: string | null;
}

/** Trims and bounds a workflow's name and description, or refuses them. */
function detailsOf(input: WorkflowDetailsInput) {
  const name = input.name.trim();
  const description = (input.description ?? '').trim();
  if (name === '' || name.length > MAX_NAME) {
    badRequest(`A workflow name must be 1 to ${MAX_NAME} characters`);
  }
  if (description.length > MAX_DESCRIPTION) {
    badRequest(`A description can be at most ${MAX_DESCRIPTION} characters`);
  }
  return { name, description };
}

/**
 * What a new workflow opens with: a Start joined to an End, so the canvas is never empty
 * and the smallest valid workflow is already there to build between.
 */
const STARTER_GRAPH = {
  nodes: [
    { key: 'start', kind: 'START', label: 'Start', x: 0, y: 0 },
    { key: 'end', kind: 'END', label: 'Done', x: 0, y: 240 },
  ],
  edges: [{ key: 'start-end', source: 'start', target: 'end', label: '' }],
};

/** Custom workflows drawn in Tools > Workflows: listing, details, the drawing, and removal. */
export const workflowsService = {
  list() {
    return ProjectWorkflowModel.find().select('-nodes -edges').sort({ updatedAt: -1 }).lean();
  },

  async get(id: string) {
    const doc = await ProjectWorkflowModel.findById(id).lean();
    if (!doc) notFound('ProjectWorkflow');
    return doc;
  },

  async create(input: WorkflowDetailsInput, actor: Actor) {
    const created = await ProjectWorkflowModel.create({
      ...detailsOf(input),
      ...STARTER_GRAPH,
      createdByName: actor.name,
      updatedByName: actor.name,
    });
    return created.toObject();
  },

  async updateDetails(id: string, input: WorkflowDetailsInput, actor: Actor) {
    const doc = await ProjectWorkflowModel.findByIdAndUpdate(
      id,
      { ...detailsOf(input), updatedByName: actor.name },
      { new: true },
    ).lean();
    if (!doc) notFound('ProjectWorkflow');
    return doc;
  },

  /** Replaces the drawing whole. A graph that breaks a rule is refused with that rule. */
  async saveGraph(id: string, graph: unknown, actor: Actor) {
    const parsed = workflowGraphSchema.safeParse(graph);
    if (!parsed.success) {
      badRequest(parsed.error.issues[0]?.message ?? 'The workflow could not be read');
    }
    const problem = workflowGraphProblem(parsed.data);
    if (problem) {
      badRequest(problem);
    }
    const doc = await ProjectWorkflowModel.findByIdAndUpdate(
      id,
      { nodes: parsed.data.nodes, edges: parsed.data.edges, updatedByName: actor.name },
      { new: true },
    ).lean();
    if (!doc) notFound('ProjectWorkflow');
    return doc;
  },

  async remove(id: string) {
    const doc = await ProjectWorkflowModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('ProjectWorkflow');
    return true;
  },
};

import { isValidObjectId } from 'mongoose';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { actorNameOf } from '../../lib/actor';
import { ROLES } from '../../constants/roles';
import { notFound } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import { ItIncidentModel } from './models';
import { IT_INCIDENT_DONE } from './itsm.enums';

const INCIDENT_MODULE = 'ItIncident';
const itOnly = [ROLES.IT];

interface IncidentInput {
  status: string;
  [field: string]: unknown;
}

const crud = createCrudResolvers(createCrudService(ItIncidentModel as never, INCIDENT_MODULE), {
  name: INCIDENT_MODULE,
  roles: itOnly,
  table: {
    searchFields: ['title', 'description', 'impact', 'commanderName', 'rootCause'],
    filterFields: ['title', 'severity', 'category', 'status', 'commanderName'],
    sortFields: ['title', 'severity', 'category', 'status', 'startedAt', 'resolvedAt'],
    defaultSort: { field: 'startedAt', dir: 'DESC' },
  },
  stats: { countBy: ['severity', 'category', 'status'] },
});

/** `resolvedAt` follows the status: stamped when it is resolved, cleared if it reopens. */
function resolvedAtFor(status: string, current: Date | null | undefined): Date | null {
  if (!IT_INCIDENT_DONE.has(status)) {
    return null;
  }
  return current ?? new Date();
}

async function incidentById(id: string) {
  const row = isValidObjectId(id) ? await ItIncidentModel.findById(id) : null;
  if (!row) {
    notFound('Incident');
  }
  return row;
}

/**
 * Incidents keep an append-only timeline. Opening one writes its first entry, and a status
 * change made from the form writes one too, so the timeline can never disagree with the
 * status it shows.
 */
export const itIncidentResolvers = {
  Query: crud.Query,
  Mutation: {
    ...crud.Mutation,
    createItIncident: async (p: unknown, args: { input: IncidentInput }, ctx: GraphQLContext) => {
      const entry = {
        status: args.input.status,
        note: 'Incident opened',
        authorName: await actorNameOf(ctx),
      };
      const input = {
        ...args.input,
        resolvedAt: resolvedAtFor(args.input.status, null),
        timeline: [entry],
      };
      return crud.Mutation.createItIncident(p, { input } as never, ctx);
    },
    updateItIncident: async (
      p: unknown,
      args: { id: string; input: IncidentInput },
      ctx: GraphQLContext,
    ) => {
      const current = await incidentById(args.id);
      const input = {
        ...args.input,
        resolvedAt: resolvedAtFor(args.input.status, current.resolvedAt),
      };
      const updated = await crud.Mutation.updateItIncident(p, { id: args.id, input } as never, ctx);
      if (current.status === args.input.status) {
        return updated;
      }
      const note = `Status changed to ${args.input.status.toLowerCase()}`;
      return appendUpdate(args.id, args.input.status, note, ctx);
    },
    addItIncidentUpdate: async (
      _p: unknown,
      args: { id: string; status: string; note: string },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, INCIDENT_MODULE, itOnly, 'EDIT');
      return appendUpdate(args.id, args.status, args.note, ctx);
    },
  },
};

/** Writes one timeline entry and moves the incident to its status. */
async function appendUpdate(id: string, status: string, note: string, ctx: GraphQLContext) {
  const incident = await incidentById(id);
  incident.timeline.push({ status, note: note.trim(), authorName: await actorNameOf(ctx) });
  incident.status = status as typeof incident.status;
  incident.resolvedAt = resolvedAtFor(status, incident.resolvedAt);
  await incident.save();
  return withId(incident.toObject());
}

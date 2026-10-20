import { AudienceListModel } from './audience.model';
import { FILTER_FIELDS, OPERATORS_BY_KIND, filterField } from './audience.fields';
import {
  loadAudienceShape,
  resolveAudience,
  type AudienceResolution,
  type AudienceShape,
} from './audience.resolve';
import { dropSnapshot, refreshSnapshot } from './audience.snapshot';
import { audienceDraftSchema, parseAudienceInput } from './audience.validation';
import { ContactModel } from '../crm/contact.model';
import { CompanyModel } from '../crm/company.model';
import { assertRole } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

/** How many suggestions the rule builder is offered for a text field. */
const MAX_FILTER_VALUES = 200;

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.MARKETING]);

const nonEmptySorted = (values: unknown[]): string[] =>
  values
    .map(String)
    .filter((value) => value.trim() !== '')
    .sort((a, b) => a.localeCompare(b));

/** One searched page of a resolution's recipients. */
function recipientPage(resolution: AudienceResolution, input: TableQueryInput) {
  const search = (input.search ?? '').trim().toLowerCase();
  const matching = search
    ? resolution.recipients.filter((row) =>
        [row.email, row.name, row.company].some((text) => text.toLowerCase().includes(search)),
      )
    : resolution.recipients;
  const start = input.page * input.pageSize;
  return { rows: matching.slice(start, start + input.pageSize), totalCount: matching.length };
}

type Mutation = (parent: unknown, args: never, ctx: GraphQLContext) => unknown;

/** The generated CRUD mutations, which own the permission check and the audit line. */
export interface AudienceCrud {
  createAudienceList: Mutation;
  updateAudienceList: Mutation;
  deleteAudienceList: Mutation;
}

/**
 * Saving validates, stores through the CRUD mutation, then freezes a fixed audience: the
 * counts the marketer confirmed in the form become the list it keeps.
 */
async function saveAudience(save: Promise<unknown>, input: AudienceShape) {
  const saved = (await save) as { id: string };
  const snapshotAt = await refreshSnapshot(saved.id, input);
  const row = await AudienceListModel.findByIdAndUpdate(
    saved.id,
    { snapshotAt },
    { new: true },
  ).lean();
  return withId(row as { _id: unknown });
}

/** The audience builder's queries and its saves, which freeze fixed audiences. */
export function audienceResolvers(crud: AudienceCrud) {
  return {
    AudienceResolution: {
      recipients: (parent: AudienceResolution, { input }: { input: TableQueryInput }) =>
        recipientPage(parent, input),
    },
    Query: {
      audienceFilterCatalogue: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
        guard(ctx);
        const [contactLabels, companyLabels] = await Promise.all([
          ContactModel.distinct('emails.label'),
          CompanyModel.distinct('emails.label'),
        ]);
        return {
          fields: FILTER_FIELDS.map((entry) => ({
            ...entry,
            values: [...entry.values],
            operators: [...OPERATORS_BY_KIND[entry.kind]],
          })),
          emailTypes: [...new Set(nonEmptySorted([...contactLabels, ...companyLabels]))],
        };
      },

      /** The values in use for a text or tag field — suggestions, never a closed list. */
      audienceFilterValues: async (
        _p: unknown,
        { field }: { field: string },
        ctx: GraphQLContext,
      ) => {
        guard(ctx);
        const entry = filterField(field);
        if (!entry?.path) {
          return [];
        }
        const model = entry.entity === 'COMPANY' ? CompanyModel : ContactModel;
        const values = await (model as typeof ContactModel).distinct(entry.path);
        return nonEmptySorted(values).slice(0, MAX_FILTER_VALUES);
      },

      previewAudience: (_p: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
        guard(ctx);
        return resolveAudience(parseAudienceInput(input, audienceDraftSchema));
      },

      audienceResolution: async (
        _p: unknown,
        { id, categoryId }: { id: string; categoryId?: string | null },
        ctx: GraphQLContext,
      ) => {
        guard(ctx);
        return resolveAudience(await loadAudienceShape(id), id, categoryId ?? '');
      },
    },
    Mutation: {
      createAudienceList: async (_p: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
        const data = parseAudienceInput(input);
        return saveAudience(
          crud.createAudienceList(_p, { input: data } as never, ctx) as Promise<unknown>,
          data,
        );
      },
      updateAudienceList: async (
        _p: unknown,
        { id, input }: { id: string; input: unknown },
        ctx: GraphQLContext,
      ) => {
        const data = parseAudienceInput(input);
        return saveAudience(
          crud.updateAudienceList(_p, { id, input: data } as never, ctx) as Promise<unknown>,
          data,
        );
      },
      deleteAudienceList: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
        const removed = await crud.deleteAudienceList(_p, { id } as never, ctx);
        await dropSnapshot(id);
        return removed;
      },
    },
  };
}

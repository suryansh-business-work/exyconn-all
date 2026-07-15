import { assertRole } from '../middleware/roleGuard';
import { withId, withIds } from '../utils/serialize';
import type { CrudService } from './crudService';
import type { Role } from '../constants/roles';
import type { GraphQLContext } from '../middleware/auth';
import type { TableConfig, TableQueryInput } from '../utils/tableQuery';

interface CrudResolverConfig {
  /** Singular GraphQL name, e.g. "Invoice" -> listInvoices/getInvoice/... */
  name: string;
  /** Roles (besides ADMIN) allowed to access this module. */
  roles: Role[];
  /** Irregular plural for the list query, e.g. "CaseStudy" -> "CaseStudies". Defaults to `${name}s`. */
  plural?: string;
  /**
   * When set, also exposes `list<Plural>Paged(input: TableQueryInput!): <Name>Page!` for a
   * server-side grid. The module's SDL must declare the matching `<Name>Page` type.
   */
  table?: TableConfig;
}

type ResolverMap = Record<string, (p: unknown, a: never, c: GraphQLContext) => unknown>;

type LeanDoc = { _id: unknown };

/**
 * Builds the standard `list/get/create/update/delete` resolver map for a module
 * from its service. Every operation is role-guarded (ADMIN always allowed).
 */
export function createCrudResolvers<TInput extends object>(
  service: CrudService<TInput>,
  { name, roles, plural, table }: CrudResolverConfig,
): { Query: ResolverMap; Mutation: ResolverMap } {
  const guard = (ctx: GraphQLContext) => assertRole(ctx, roles);
  const listName = plural ?? `${name}s`;

  const query: ResolverMap = {
    [`list${listName}`]: async (_p, _a, ctx) => {
      guard(ctx);
      return withIds((await service.list()) as LeanDoc[]);
    },
    [`get${name}`]: async (_p, { id }: { id: string }, ctx) => {
      guard(ctx);
      return withId((await service.get(id)) as LeanDoc);
    },
  };

  if (table) {
    query[`list${listName}Paged`] = async (_p, { input }: { input: TableQueryInput }, ctx) => {
      guard(ctx);
      const page = await service.paged(input, table);
      return { rows: withIds(page.rows as LeanDoc[]), totalCount: page.totalCount };
    };
  }

  return {
    Query: query,
    Mutation: {
      [`create${name}`]: async (_p, { input }: { input: TInput }, ctx) => {
        guard(ctx);
        return withId((await service.create(input)) as { _id: unknown });
      },
      [`update${name}`]: async (_p, { id, input }: { id: string; input: Partial<TInput> }, ctx) => {
        guard(ctx);
        return withId((await service.update(id, input)) as { _id: unknown });
      },
      [`delete${name}`]: async (_p, { id }: { id: string }, ctx) => {
        guard(ctx);
        return service.remove(id);
      },
    } as ResolverMap,
  };
}

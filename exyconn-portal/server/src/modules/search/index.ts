import { searchEverything } from './search.service';
import { searchTypeDefs } from './search.typeDefs';
import { assertAuthenticated } from '../../middleware/roleGuard';
import type { Role } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

export const searchResolvers = {
  Query: {
    search: async (_p: unknown, { query }: { query: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return searchEverything(query, (user.roles ?? []) as Role[]);
    },
  },
};

export { searchTypeDefs };
export { registerSearchProvider, searchProviders, clearSearchProviders } from './search.registry';
export type { SearchProvider, SearchHit } from './search.registry';
export { containsAny, escapeForRegex, MIN_QUERY_LENGTH } from './search.text';
export { searchEverything } from './search.service';
export type { SearchGroup } from './search.service';

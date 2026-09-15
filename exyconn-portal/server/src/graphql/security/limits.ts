import type { ApolloServerPlugin } from '@apollo/server';
import { ApolloArmor } from '@escape.tech/graphql-armor';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * Shape limits on every GraphQL document, checked before a resolver runs.
 *
 * Measured on 2026-09-15 across every operation a client ships — 749 portal operations
 * (packages/shell, fragments expanded and Apollo's `__typename` added), 27 tracker operations
 * (packages/tracker-core, shared by the desktop and phone trackers) and 20 website queries
 * (exyconn-website/src/lib) — with graphql-armor's own counting rules:
 *
 * | limit      | largest seen                              | allowed |
 * | ---------- | ----------------------------------------- | ------- |
 * | depth      | 9  (SocialFeed, SocialUserPosts)          | 14      |
 * | aliases    | 0                                         | 10      |
 * | directives | 0                                         | 10      |
 * | cost       | 645 (TrackerMe / TrackerHeartbeat)        | 2000    |
 * | tokens     | 142 (TrackerHeartbeat)                    | 1000    |
 *
 * Each is well above what a real client sends, so none of them is a product constraint —
 * they exist to refuse the hand-written documents an attacker uses to make one request
 * expensive (a thousand aliases, a query nested fifty deep). A new operation that trips one
 * is almost certainly a mistake; re-measure before raising a number.
 */
export const GRAPHQL_LIMITS = Object.freeze({
  maxDepth: 14,
  maxAliases: 10,
  maxDirectives: 10,
  maxCost: 2000,
  maxTokens: 1000,
});

/**
 * graphql-armor's Apollo protections at {@link GRAPHQL_LIMITS}: validation rules for depth,
 * aliases, directives and cost, a token-counting parser, and "Did you mean …?" suggestions
 * masked so a caller cannot map the schema by guessing field names. The limits are not
 * echoed back in the error message.
 */
export function graphqlArmor() {
  const armor = new ApolloArmor({
    maxDepth: { n: GRAPHQL_LIMITS.maxDepth, exposeLimits: false },
    maxAliases: { n: GRAPHQL_LIMITS.maxAliases, exposeLimits: false },
    maxDirectives: { n: GRAPHQL_LIMITS.maxDirectives, exposeLimits: false },
    costLimit: { maxCost: GRAPHQL_LIMITS.maxCost, exposeLimits: false },
    maxTokens: { n: GRAPHQL_LIMITS.maxTokens, exposeLimits: false },
    blockFieldSuggestion: { enabled: true },
  }).protect();
  // Armor types its plugins against its own copy of @apollo/server's declarations (ESM vs
  // CJS), which TypeScript treats as a different type. They only read the request and its
  // errors, never the context, so they are this server's plugins.
  return {
    ...armor,
    plugins: armor.plugins as unknown as ApolloServerPlugin<GraphQLContext>[],
  };
}

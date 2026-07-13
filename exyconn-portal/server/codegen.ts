import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Generates strongly-typed resolver signatures from the SDL declared across the
 * `*.typeDefs.ts` files (plucked from the `gql` tag). Output is consumed by the
 * resolvers for full type safety (CLAUDE.md rule 13).
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: './src/**/*.typeDefs.ts',
  generates: {
    './src/graphql/generated/types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useIndexSignature: true,
        contextType: '../../middleware/auth#GraphQLContext',
        scalars: { DateTime: 'Date' },
        enumsAsTypes: false,
      },
    },
  },
};

export default config;

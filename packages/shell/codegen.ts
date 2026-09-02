import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Generates typed Apollo hooks from the GraphQL operations in
 * `src/graphql/operations` against the server's SDL (read directly from the
 * server `*.typeDefs.ts` files). Consumed across the app (CLAUDE.md rule 13).
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: '../../exyconn-portal/server/src/**/*.typeDefs.ts',
  documents: 'src/graphql/operations/**/*.graphql',
  generates: {
    'src/graphql/generated/index.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
        scalars: { DateTime: 'string' },
      },
    },
  },
};

export default config;

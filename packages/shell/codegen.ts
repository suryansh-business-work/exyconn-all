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
        // Apollo 4 moved every React binding — the hooks and the result/option types
        // the aliases below are built from — out of the root entry point.
        apolloReactHooksImportFrom: '@apollo/client/react',
        apolloReactCommonImportFrom: '@apollo/client/react',
        // Aliases for types Apollo 4 no longer has (MutationFunction, BaseMutationOptions,
        // QueryResult). Nothing in the workspace referenced them; generating them only
        // produced three hundred references to members that are gone.
        withMutationFn: false,
        withMutationOptionsType: false,
        withResultType: false,
        scalars: { DateTime: 'string' },
      },
    },
  },
};

export default config;

import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Types every tracker operation against the portal's own SDL, read straight from the server's
 * `*.typeDefs.ts` files (CLAUDE.md rule 13). A selection that drifts from the schema fails
 * here, at generate time, instead of as an HTTP 400 that nobody can sign in past — which is
 * what a stale `autoSyncEnabled` field once did to the desktop app.
 *
 * `documentMode: 'string'` emits each operation as its query text, so neither tracker ships
 * the `graphql` runtime just to print a document back into the string it started as.
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: '../../exyconn-portal/server/src/**/*.typeDefs.ts',
  documents: 'src/graphql/operations/**/*.graphql',
  generates: {
    'src/graphql/generated/index.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        documentMode: 'string',
        onlyOperationTypes: true,
        enumsAsTypes: true,
        avoidOptionals: true,
        skipTypename: true,
        scalars: { DateTime: 'string' },
      },
    },
  },
};

export default config;

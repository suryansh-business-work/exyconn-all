import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Types every extension operation against the portal's own SDL, read straight from the server's
 * `*.typeDefs.ts` files (CLAUDE.md rule 13) — the same setup as @exyconn/tracker-core.
 *
 * `documentMode: 'string'` emits each operation as its query text, so the extension posts plain
 * strings and ships neither Apollo nor the `graphql` runtime.
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: [
    '../exyconn-portal/server/src/**/*.typeDefs.ts',
    '../demos/whatsapp-demo/server/src/**/*.typeDefs.ts',
  ],
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

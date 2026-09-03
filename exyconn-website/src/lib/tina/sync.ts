import { TinaSchema } from "@tinacms/schema-tools";
import database from "../../../tina/database";
import graphQLSchema from "../../../tina/__generated__/_graphql.json";
import lookup from "../../../tina/__generated__/_lookup.json";
import schema from "../../../tina/__generated__/_schema.json";

type IndexArgs = Parameters<typeof database.indexContent>[0];
type SchemaConfig = ConstructorParameters<typeof TinaSchema>[0];

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

// A database that cannot be reached leaves the level adapter's open() pending forever, which
// would hang every editor request instead of failing it.
const INDEX_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

let indexing: Promise<void> | undefined;

/**
 * Indexes the deployed content files into the self-hosted database once per server process.
 *
 * The files in git are the source of truth: the database only mirrors them for the editor, and
 * every save is committed back to git. Re-indexing at startup therefore makes each deploy the
 * moment the editor catches up with whatever landed in the repository. The data layer seeds the
 * users collection only when the database has none yet, so passwords changed in the editor
 * survive re-indexing. In local development the Tina CLI owns the index.
 */
export function ensureIndexed(): Promise<void> {
  if (isLocal) {
    return Promise.resolve();
  }
  indexing ??= withTimeout(
    database.indexContent({
      graphQLSchema: graphQLSchema as IndexArgs["graphQLSchema"],
      tinaSchema: new TinaSchema(schema as unknown as SchemaConfig),
      lookup,
    }),
    INDEX_TIMEOUT_MS,
    `Indexing the content into the database did not finish within ${INDEX_TIMEOUT_MS / 1000}s`
  )
    .then(() => undefined)
    .catch((error: unknown) => {
      // Let the next request retry instead of serving a cached failure.
      indexing = undefined;
      throw error;
    });
  return indexing;
}

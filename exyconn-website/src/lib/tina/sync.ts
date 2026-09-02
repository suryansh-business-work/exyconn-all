import { TinaSchema } from "@tinacms/schema-tools";
import database from "../../../tina/database";
import graphQLSchema from "../../../tina/__generated__/_graphql.json";
import lookup from "../../../tina/__generated__/_lookup.json";
import schema from "../../../tina/__generated__/_schema.json";

type IndexArgs = Parameters<typeof database.indexContent>[0];
type SchemaConfig = ConstructorParameters<typeof TinaSchema>[0];

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

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
  indexing ??= database
    .indexContent({
      graphQLSchema: graphQLSchema as IndexArgs["graphQLSchema"],
      tinaSchema: new TinaSchema(schema as unknown as SchemaConfig),
      lookup,
    })
    .then(() => undefined)
    .catch((error: unknown) => {
      // Let the next request retry instead of serving a cached failure.
      indexing = undefined;
      throw error;
    });
  return indexing;
}

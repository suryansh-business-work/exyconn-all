import { FilesystemBridge, createDatabase, createLocalDatabase } from "@tinacms/datalayer";
import mongodbLevel from "mongodb-level";
import { GitHubProvider } from "tinacms-gitprovider-github";

/**
 * `pnpm dev` sets TINA_PUBLIC_IS_LOCAL=true: the editor reads and writes the working tree
 * through the CLI's in-memory data layer and needs no credentials.
 *
 * In production the content is indexed into MongoDB (see src/lib/tina/sync.ts) and every save
 * is committed to GitHub, which triggers the deploy that publishes it. The bridge reads the
 * content files from the process working directory, where the Docker image keeps them.
 */
// mongodb-level is CommonJS without ESM named exports, so Node only exposes module.exports.
const { MongodbLevel } = mongodbLevel;

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const branch = process.env.GITHUB_BRANCH ?? "main";

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
      bridge: new FilesystemBridge(process.cwd()),
      gitProvider: new GitHubProvider({
        branch,
        owner: process.env.GITHUB_OWNER as string,
        repo: process.env.GITHUB_REPO as string,
        token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN as string,
        // The website is one package of the monorepo; content paths are relative to it.
        rootPath: "exyconn-website",
      }),
      databaseAdapter: new MongodbLevel<string, Record<string, unknown>>({
        collectionName: `tinacms-${branch}`,
        dbName: "tinacms",
        mongoUri: process.env.MONGODB_URI as string,
      }),
      namespace: branch,
    });

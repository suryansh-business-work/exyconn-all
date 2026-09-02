import { LocalBackendAuthProvider, TinaNodeBackend } from "@tinacms/datalayer";
import databaseClient from "../../../tina/__generated__/databaseClient";
import { authJsBackendAuthProvider, tinaAuthOptions } from "./authjs";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

// Local development trusts every request (the editor runs on the developer's machine). In
// production the Auth.js provider checks the session cookie against the users collection.
const authProvider = isLocal
  ? LocalBackendAuthProvider()
  : authJsBackendAuthProvider(
      tinaAuthOptions(databaseClient, process.env.NEXTAUTH_SECRET as string)
    );

/** The TinaCMS backend (GraphQL + auth routes) as a Node request handler. */
export const tinaBackend = TinaNodeBackend({ authProvider, databaseClient });

import type { BackendAuthProvider } from "@tinacms/datalayer";
import type { IncomingMessage } from "node:http";
import NextAuthImport, { type AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { getServerSession } from "next-auth/next";
import CredentialsImport from "next-auth/providers/credentials";

/**
 * The server half of Tina's Auth.js provider, adapted from the `tinacms-authjs` package
 * (Apache-2.0). That package is only used for the editor bundle (see tina/config.ts): depending
 * on it from the server would pull the whole `tinacms` UI library into the production image as a
 * peer dependency, while the backend needs nothing beyond these functions on top of next-auth.
 */

const PROVIDER_NAME = "TinaCredentials";

// next-auth ships CommonJS; depending on how it is loaded the default export is nested.
const interopDefault = <T>(mod: T): T => (mod as { default?: T }).default ?? mod;
const NextAuth = interopDefault(NextAuthImport);
const CredentialsProvider = interopDefault(CredentialsImport);

interface AuthorizeResult {
  data?: { authorize?: { _password?: { passwordChangeRequired?: boolean } } | null } | null;
}

/** The `authenticate` / `authorize` helpers of the generated tina/__generated__/databaseClient. */
export interface AuthDatabaseClient {
  authenticate: (credentials: {
    username: string;
    password: string;
  }) => Promise<{ data?: { authenticate?: unknown } | null }>;
  authorize: (user: { sub: string }) => Promise<AuthorizeResult>;
}

type TinaToken = JWT & { role?: string; passwordChangeRequired?: boolean };
type TinaSessionUser = { role?: string; passwordChangeRequired?: boolean; sub?: string };

export function tinaAuthOptions(databaseClient: AuthDatabaseClient, secret: string): AuthOptions {
  return {
    secret,
    session: { strategy: "jwt" },
    providers: [
      CredentialsProvider({
        id: "credentials",
        name: PROVIDER_NAME,
        credentials: {
          username: { label: "Username", type: "text" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (credentials) => {
          if (!credentials) {
            return null;
          }
          const result = await databaseClient.authenticate(credentials);
          return (result.data?.authenticate as { id: string } | null | undefined) ?? null;
        },
      }),
    ],
    callbacks: {
      // Runs with `account` set only on sign-in: resolve the user's role from the users collection.
      jwt: async ({ token, account }) => {
        const tinaToken = token as TinaToken;
        if (account && token.sub) {
          const result = await databaseClient.authorize({ sub: token.sub });
          tinaToken.role = result.data?.authorize ? "user" : "guest";
          tinaToken.passwordChangeRequired =
            result.data?.authorize?._password?.passwordChangeRequired ?? false;
        }
        return tinaToken;
      },
      session: async ({ session, token }) => {
        const tinaToken = token as TinaToken;
        const user = session.user as TinaSessionUser;
        user.role = tinaToken.role;
        user.passwordChangeRequired = tinaToken.passwordChangeRequired;
        user.sub = tinaToken.sub;
        return session;
      },
    },
  };
}

type RequestWithQuery = IncomingMessage & { query: Record<string, unknown>; session?: unknown };

/** Guards /api/tina/gql with the Auth.js session and serves the /api/tina/auth/* routes. */
export function authJsBackendAuthProvider(authOptions: AuthOptions): BackendAuthProvider {
  return {
    isAuthorized: async (req, res) => {
      const session = await getServerSession(req as never, res as never, authOptions);
      (req as RequestWithQuery).session = session;
      const user = session?.user as TinaSessionUser | undefined;
      if (!user) {
        return { isAuthorized: false, errorCode: 401, errorMessage: "Unauthorized" };
      }
      if (user.role !== "user") {
        return { isAuthorized: false, errorCode: 403, errorMessage: "Forbidden" };
      }
      return { isAuthorized: true };
    },
    extraRoutes: {
      auth: {
        secure: false,
        handler: async (req, res, opts) => {
          const url = new URL(req.url ?? "", `http://${req.headers.host ?? "localhost"}`);
          const request = req as RequestWithQuery;
          const basePath = opts?.basePath ?? "/api/tina/";
          request.query.nextauth = url.pathname.replace(`${basePath}auth/`, "").split("/");
          await NextAuth(authOptions)(request, res);
        },
      },
    },
  };
}

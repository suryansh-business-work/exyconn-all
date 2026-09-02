import { resolve } from "@tinacms/datalayer";
import database from "../../../tina/database";

/**
 * The database client the Tina backend runs GraphQL operations through. It mirrors the client
 * `tinacms build` generates in tina/__generated__/databaseClient.ts, minus that file's import of
 * the `tinacms` UI package: the editor bundle needs it, the server does not, and it is not
 * installed in the production image.
 */

interface RequestArgs {
  query: string;
  variables?: Record<string, unknown>;
  user?: { sub: string };
}

// The fields of the TinaUserCollection entry that login and authorization return.
const AUTH_FIELDS = "id:username name email _password: password { passwordChangeRequired }";

export function request({ query, variables = {}, user }: RequestArgs) {
  return resolve({
    config: { useRelativeMedia: true },
    database,
    query,
    variables,
    verbose: true,
    ctxUser: user,
  });
}

export function authenticate({ username, password }: { username: string; password: string }) {
  return request({
    query: `query auth($username: String!, $password: String!) {
      authenticate(sub: $username, password: $password) { ${AUTH_FIELDS} }
    }`,
    variables: { username, password },
  });
}

export function authorize(user: { sub: string }) {
  return request({ query: `query authz { authorize { ${AUTH_FIELDS} } }`, user });
}

export const databaseClient = { request, authenticate, authorize };

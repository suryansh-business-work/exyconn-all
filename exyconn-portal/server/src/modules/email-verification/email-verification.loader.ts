import type { GraphQLContext } from '../../middleware/auth';
import { normalizeEmail, verificationsFor } from './email-verification.service';

type Verification =
  Awaited<ReturnType<typeof verificationsFor>> extends Map<string, infer Row> ? Row : never;
type Load = (email: string) => Promise<Verification | null>;

/** One loader per request: a grid page asks for every row's result, and gets one query. */
const loaders = new WeakMap<GraphQLContext, Load>();

/**
 * The stored check of an address, batched: every address asked for while GraphQL resolves one
 * list is looked up together once the list has been walked (a microtask later).
 */
export function verificationLoader(ctx: GraphQLContext): Load {
  const existing = loaders.get(ctx);
  if (existing) {
    return existing;
  }
  const cache = new Map<string, Promise<Verification | null>>();
  let waiting: Array<{
    email: string;
    resolve: (row: Verification | null) => void;
    reject: (error: unknown) => void;
  }> = [];

  const flush = () => {
    const batch = waiting;
    waiting = [];
    verificationsFor(batch.map((item) => item.email)).then(
      (rows) => batch.forEach((item) => item.resolve(rows.get(item.email) ?? null)),
      (error: unknown) => batch.forEach((item) => item.reject(error)),
    );
  };

  const load: Load = (rawEmail) => {
    const email = normalizeEmail(rawEmail);
    const cached = cache.get(email);
    if (cached) {
      return cached;
    }
    const promise = new Promise<Verification | null>((resolve, reject) => {
      if (waiting.length === 0) {
        queueMicrotask(flush);
      }
      waiting.push({ email, resolve, reject });
    });
    cache.set(email, promise);
    return promise;
  };
  loaders.set(ctx, load);
  return load;
}

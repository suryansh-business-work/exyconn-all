import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { RateLimiterMongo, RateLimiterRes } from 'rate-limiter-flexible';

/**
 * Rate limits that hold across restarts and across API instances.
 *
 * The counters live in one Mongo collection (`rate_limits`) on the connection the API already
 * has — there is no Redis in this stack. Each document carries an `expire` date and the store
 * puts a TTL index on it, so the collection only ever holds the windows that are still open:
 * a flood of distinct keys cannot grow memory in the process, and ages out of the database on
 * its own.
 *
 * Tests use the same store: they run against mongodb-memory-server on the default connection,
 * and the harness empties every collection after each test, which resets every limit with it.
 */
const COLLECTION = 'rate_limits';

/** One limit: how many points a key may spend in a window, and how long a key over it waits. */
export interface LimitRule {
  /** Distinguishes this limit's keys from every other limit's in the shared collection. */
  keyPrefix: string;
  points: number;
  durationSec: number;
  /** Once over the limit, the key is refused for this long. Defaults to the rest of the window. */
  blockDurationSec?: number;
}

export interface Limiter {
  /** Spends one point for `key`; false when the key is over its limit. */
  allow(key: string): Promise<boolean>;
  /** Milliseconds before `key` may try again; 0 when it has points left. */
  retryAfterMs(key: string): Promise<number>;
  /** Spends one point for a failure, and blocks the key the moment its points run out. */
  fail(key: string): Promise<void>;
  /** Forgets `key`'s spent points — a success that proves the earlier failures were a typo. */
  forgive(key: string): Promise<void>;
  /** Test seam: forgets every key this limit has counted. */
  reset(): Promise<void>;
}

/** A spent limit rejects with its result; anything else is the store failing, and is rethrown. */
function refused(error: unknown): false {
  if (error instanceof RateLimiterRes) {
    return false;
  }
  throw error;
}

/**
 * The store for one limit, with the collection's indexes (the TTL on `expire`, the unique key)
 * built before its first use. Built on first use rather than at import, so a module that
 * declares a limit can be imported by a script that never connects to the database. A failed
 * build is forgotten, so the next call tries again instead of failing for the process's life.
 */
function lazyStore(rule: LimitRule): () => Promise<RateLimiterMongo> {
  let ready: Promise<RateLimiterMongo> | null = null;
  const build = async () => {
    const store = new RateLimiterMongo({
      storeClient: mongoose.connection,
      tableName: COLLECTION,
      keyPrefix: rule.keyPrefix,
      points: rule.points,
      duration: rule.durationSec,
      disableIndexesCreation: true,
    });
    await store.createIndexes();
    return store;
  };
  return () => {
    ready ??= build().catch((error: unknown) => {
      ready = null;
      throw error;
    });
    return ready;
  };
}

/** Creates a limit, counted in the shared store. */
export function createLimiter(rule: LimitRule): Limiter {
  const limiter = lazyStore(rule);
  const blockSec = rule.blockDurationSec ?? rule.durationSec;

  return {
    async allow(key) {
      const store = await limiter();
      return store.consume(key).then(() => true, refused);
    },
    async retryAfterMs(key) {
      const res = await (await limiter()).get(key);
      if (!res || res.consumedPoints < rule.points) {
        return 0;
      }
      return Math.max(res.msBeforeNext, 1);
    },
    async fail(key) {
      const store = await limiter();
      const res = await store.penalty(key);
      if (res.consumedPoints === rule.points) {
        await store.block(key, blockSec);
      }
    },
    async forgive(key) {
      await (await limiter()).delete(key);
    },
    async reset() {
      await mongoose.connection
        .collection(COLLECTION)
        .deleteMany({ key: { $regex: `^${rule.keyPrefix}:` } });
    },
  };
}

/** Throws the error a client shows as "slow down", with how long to wait. */
export function tooManyRequests(retryAfterMs: number, what = 'attempts'): never {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  throw new GraphQLError(`Too many ${what}. Try again in ${minutes} minute(s).`, {
    extensions: { code: 'TOO_MANY_REQUESTS', retryAfterSeconds: Math.ceil(retryAfterMs / 1000) },
  });
}

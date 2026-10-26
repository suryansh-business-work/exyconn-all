import { currentRequestInfo } from '../../../lib/requestInfo';
import { currentOrganizationId, runAsPlatform } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';
import { computeCostUsd, priceForModel } from '../../ai/ai.pricing';
import { IntegrationCallModel } from './call-log.model';
import { IntegrationUsageModel, type IntegrationProvider } from './usage.model';

/** One call to count: which integration, what was called, whether it worked, its tokens. */
export interface MeteredCall {
  provider: IntegrationProvider;
  action: string;
  ok: boolean;
  inputTokens?: number;
  outputTokens?: number;
  durationMs?: number;
  /** Why it failed, in a few words; never a response body. */
  error?: string;
}

/** The UTC day a call counts towards. */
export function usageDay(at: Date): string {
  return at.toISOString().slice(0, 10);
}

const BACKGROUND = 'Background job';

/** Path segments that name one record (ids, numbers, emails, long tokens), not a kind of call. */
const ID_SEGMENT = /^(?=.*\d)[\w.@:%-]{6,}$|^[\w-]{24,}$/;

/**
 * A request path as a kind of call — `GET /v1/payment_intents/:id` — so the daily counters and
 * filters group calls by what they do rather than one row per record.
 */
export function pathAction(method: string, path: string): string {
  const [bare] = path.split('?');
  const segments = (bare ?? '')
    .split('/')
    .map((segment) => (ID_SEGMENT.test(decodeURIComponent(segment)) ? ':id' : segment));
  return `${method.toUpperCase()} ${segments.join('/')}`.slice(0, 120);
}

/** What a call is worth, where a price is kept (OpenAI models, from Tech > AI pricing). */
async function costOf(call: MeteredCall, action: string): Promise<number | null> {
  if (call.provider !== 'OPENAI' || !call.ok) {
    return null;
  }
  const price = await priceForModel(action);
  if (!price) {
    return null;
  }
  return computeCostUsd(
    { promptTokens: call.inputTokens ?? 0, completionTokens: call.outputTokens ?? 0 },
    price,
  );
}

/** One row in the call log, with who and where read from the request (if there is one). */
async function logCall(call: MeteredCall, action: string, companyId: string): Promise<void> {
  const info = currentRequestInfo();
  const costUsd = await costOf(call, action);
  await IntegrationCallModel.create({
    provider: call.provider,
    action,
    ok: call.ok,
    durationMs: Math.max(0, Math.round(call.durationMs ?? 0)),
    inputTokens: call.inputTokens ?? 0,
    outputTokens: call.outputTokens ?? 0,
    costUsd,
    companyId,
    actorId: info?.actorId ?? '',
    actorEmail: info?.actorEmail ?? '',
    source: info?.origin || (info ? info.path : BACKGROUND),
    path: info?.path ?? '',
    error: (call.error ?? '').slice(0, 300),
  });
}

/**
 * Adds one call to its day's counter and to the call log. Fire-and-forget by design: counting
 * must never slow or fail the call it counts, so a failed write is logged and dropped.
 */
export function meterCall(call: MeteredCall): void {
  const action = call.action.trim().slice(0, 120) || 'call';
  const companyId = currentOrganizationId() ?? '';
  runAsPlatform(async () => {
    await IntegrationUsageModel.updateOne(
      { provider: call.provider, action, day: usageDay(new Date()) },
      {
        $inc: {
          calls: 1,
          failures: call.ok ? 0 : 1,
          inputTokens: call.inputTokens ?? 0,
          outputTokens: call.outputTokens ?? 0,
        },
      },
      { upsert: true },
    );
    await logCall(call, action, companyId);
  }).catch((error: unknown) =>
    logger.warn({ err: error, provider: call.provider }, 'Could not count an integration call'),
  );
}

const reasonOf = (error: unknown) => (error instanceof Error ? error.message : 'Failed');

/**
 * Runs a call to an integration and counts it, worked or failed. `tokensOf` reads the token
 * usage off a successful answer, for the integrations that bill by token.
 */
export async function metered<T>(
  provider: IntegrationProvider,
  action: string,
  call: () => Promise<T>,
  tokensOf?: (result: T) => { inputTokens: number; outputTokens: number },
): Promise<T> {
  const started = Date.now();
  try {
    const result = await call();
    meterCall({
      provider,
      action,
      ok: true,
      durationMs: Date.now() - started,
      ...tokensOf?.(result),
    });
    return result;
  } catch (error) {
    meterCall({
      provider,
      action,
      ok: false,
      durationMs: Date.now() - started,
      error: reasonOf(error),
    });
    throw error;
  }
}

/**
 * `fetch`, counted: a network failure or an HTTP error answer counts as a failed call, and the
 * response is handed back untouched, so the caller reads and reports it exactly as before.
 */
export async function meteredFetch(
  provider: IntegrationProvider,
  action: string,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const started = Date.now();
  try {
    const response = await fetch(input, init);
    meterCall({
      provider,
      action,
      ok: response.ok,
      durationMs: Date.now() - started,
      error: response.ok ? '' : `HTTP ${response.status}`,
    });
    return response;
  } catch (error) {
    meterCall({
      provider,
      action,
      ok: false,
      durationMs: Date.now() - started,
      error: reasonOf(error),
    });
    throw error;
  }
}

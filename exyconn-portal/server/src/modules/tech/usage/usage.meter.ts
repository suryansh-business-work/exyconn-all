import { runAsPlatform } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';
import { IntegrationUsageModel, type IntegrationProvider } from './usage.model';

/** One call to count: which integration, what was called, whether it worked, its tokens. */
export interface MeteredCall {
  provider: IntegrationProvider;
  action: string;
  ok: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

/** The UTC day a call counts towards. */
export function usageDay(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/**
 * Adds one call to its day's counter. Fire-and-forget by design: counting must never slow or
 * fail the call it counts, so a failed count is logged and dropped, never thrown.
 */
export function meterCall(call: MeteredCall): void {
  const action = call.action.trim().slice(0, 120) || 'call';
  runAsPlatform(() =>
    IntegrationUsageModel.updateOne(
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
    ),
  ).catch((error: unknown) =>
    logger.warn({ err: error, provider: call.provider }, 'Could not count an integration call'),
  );
}

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
  try {
    const result = await call();
    meterCall({ provider, action, ok: true, ...tokensOf?.(result) });
    return result;
  } catch (error) {
    meterCall({ provider, action, ok: false });
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
  try {
    const response = await fetch(input, init);
    meterCall({ provider, action, ok: response.ok });
    return response;
  } catch (error) {
    meterCall({ provider, action, ok: false });
    throw error;
  }
}

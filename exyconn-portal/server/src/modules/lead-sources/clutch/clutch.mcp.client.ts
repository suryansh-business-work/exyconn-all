import { meteredFetch } from '../../tech/usage/usage.meter';
import { badRequest } from '../../../utils/errors';
import type { Raw } from './clutch.types';

/** Clutch's public MCP server: free, no account, answers search, profiles and reviews. */
export const CLUTCH_MCP_URL = 'https://bot.clutch.co/mcp';
const TIMEOUT_MS = 45_000;

let requestId = 0;

/** The JSON-RPC answer in an `event: message` stream, or a plain JSON body. */
function answerOf(body: string): Raw {
  const line = body.split('\n').find((row) => row.startsWith('data: '));
  return JSON.parse(line ? line.slice('data: '.length) : body) as Raw;
}

/**
 * Calls one tool on Clutch's MCP server and returns its structured result. Stateless: the
 * server answers a tools/call without a session. Counted under Environment Variables > Usage.
 */
export async function callClutchTool(name: string, args: Raw): Promise<Raw> {
  requestId += 1;
  const response = await meteredFetch('CLUTCH', `tools/call ${name}`, CLUTCH_MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    badRequest(`Clutch answered HTTP ${response.status}. Try again in a minute.`);
  }
  const answer = answerOf(await response.text());
  const result = (answer.result ?? {}) as Raw;
  if (answer.error || result.isError) {
    badRequest('Clutch could not answer that search. Try different words.');
  }
  const structured = (result.structuredContent ?? {}) as Raw;
  return (structured.result ?? structured) as Raw;
}

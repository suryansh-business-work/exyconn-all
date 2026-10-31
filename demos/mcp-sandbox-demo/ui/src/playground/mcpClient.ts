/**
 * The smallest MCP client the playground needs: JSON-RPC over the server's streamable HTTP
 * endpoint, answered as plain JSON (the server is stateless), authorised with the visitor's
 * sandbox token. Exactly what Claude sends, so the playground sees what Claude would.
 */

/** One tool as `tools/list` describes it. */
export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
}

/** What `tools/call` answered: its text, and whether the tool (or a refusal) failed. */
export interface McpToolAnswer {
  text: string;
  isError: boolean;
}

/** A refused or failed request, with a sentence the visitor can act on. */
export class McpRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'McpRequestError';
  }
}

const ACCEPT = 'application/json, text/event-stream';

interface RpcReply<T> {
  result?: T;
  error?: { message?: string };
}

async function rpc<T>(url: string, token: string, method: string, params: object): Promise<T> {
  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: ACCEPT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  if (response.status === 401) {
    throw new McpRequestError('This token has expired or was revoked. Take a new one.', 401);
  }
  const reply = (await response.json()) as RpcReply<T>;
  if (!response.ok || reply.error || reply.result === undefined) {
    throw new McpRequestError(
      reply.error?.message ?? 'The MCP server could not answer.',
      response.status,
    );
  }
  return reply.result;
}

/** Every tool the token may call, sorted by name. */
export async function listTools(url: string, token: string): Promise<McpTool[]> {
  const { tools } = await rpc<{ tools: McpTool[] }>(url, token, 'tools/list', {});
  return tools.toSorted((a, b) => a.name.localeCompare(b.name));
}

/** Runs one tool with its arguments; the answer's text parts joined. */
export async function callTool(
  url: string,
  token: string,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolAnswer> {
  const result = await rpc<{ content?: Array<{ type: string; text?: string }>; isError?: boolean }>(
    url,
    token,
    'tools/call',
    { name, arguments: args },
  );
  const text = (result.content ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('\n');
  return { text, isError: result.isError === true };
}

import { useCallback, useMemo, useState } from 'react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { callTool, listTools, type McpTool, type McpToolAnswer } from './mcpClient';

/** A stand-in value of each JSON type, so the example arguments are valid as they stand. */
const EXAMPLE_VALUES: Record<string, unknown> = {
  string: '',
  number: 1,
  integer: 1,
  boolean: false,
  array: [],
  object: {},
};

/** The tool's required arguments with stand-in values, as the form's starting JSON. */
export function exampleArgs(tool: McpTool): string {
  const properties = tool.inputSchema?.properties ?? {};
  const example = Object.fromEntries(
    (tool.inputSchema?.required ?? []).map((name) => [
      name,
      EXAMPLE_VALUES[properties[name]?.type ?? 'string'] ?? '',
    ]),
  );
  return JSON.stringify(example, null, 2);
}

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/**
 * The browser playground: the tools the visitor's sandbox token may call (read-only ones only,
 * as the server offers them), the one picked, and running it.
 */
export function usePlayground(endpointUrl: string, token: string) {
  const [tools, setTools] = useState<McpTool[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState<McpToolAnswer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTools(await listTools(endpointUrl, token));
    } catch (error_) {
      portalLogger.warn('MCP sandbox: listing tools failed', error_);
      setError(messageOf(error_, 'The tools could not be listed.'));
    } finally {
      setLoading(false);
    }
  }, [endpointUrl, token]);

  const select = useCallback((name: string) => {
    setSelectedName(name);
    setAnswer(null);
  }, []);

  const run = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      setRunning(true);
      try {
        setAnswer(await callTool(endpointUrl, token, name, args));
      } catch (error_) {
        portalLogger.warn('MCP sandbox: running a tool failed', error_);
        setAnswer({ text: messageOf(error_, 'The tool could not be run.'), isError: true });
      } finally {
        setRunning(false);
      }
    },
    [endpointUrl, token],
  );

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return (tools ?? []).filter((tool) => tool.name.toLowerCase().includes(needle));
  }, [filter, tools]);

  return {
    tools,
    shown,
    loading,
    error,
    filter,
    setFilter,
    selected: tools?.find((tool) => tool.name === selectedName) ?? null,
    select,
    running,
    answer,
    load,
    run,
  };
}

export type Playground = ReturnType<typeof usePlayground>;

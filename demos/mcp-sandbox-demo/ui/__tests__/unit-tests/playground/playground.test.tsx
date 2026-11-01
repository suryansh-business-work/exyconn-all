import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callTool, listTools, McpRequestError } from '../../../src/playground/mcpClient';
import { exampleArgs, usePlayground } from '../../../src/playground/usePlayground';
import { ENDPOINT, renderHookWithProviders, reply } from '../test-utils';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('the MCP client', () => {
  it('lists the tools by name, sending the token as Claude does', async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, { result: { tools: [{ name: 'listLeads' }, { name: 'crmDashboard' }] } }),
    );
    const tools = await listTools(ENDPOINT, 'secret');
    expect(tools.map((tool) => tool.name)).toEqual(['crmDashboard', 'listLeads']);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer secret',
      Accept: 'application/json, text/event-stream',
    });
    expect(JSON.parse(init.body)).toMatchObject({ jsonrpc: '2.0', method: 'tools/list' });
  });

  it('says plainly when the token no longer works', async () => {
    fetchMock.mockResolvedValueOnce(reply(401, {}));
    await expect(listTools(ENDPOINT, 'old')).rejects.toThrow(/expired or was revoked/);
  });

  it('passes on the server’s reason, or a plain one', async () => {
    fetchMock.mockResolvedValueOnce(reply(403, { error: { message: 'Not for this server' } }));
    const refused = await listTools(ENDPOINT, 't').catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(McpRequestError);
    expect(refused).toMatchObject({ message: 'Not for this server', status: 403 });
    fetchMock.mockResolvedValueOnce(reply(500, {}));
    await expect(listTools(ENDPOINT, 't')).rejects.toThrow('The MCP server could not answer.');
  });

  it('runs a tool, joining its text parts and keeping its error flag', async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, {
        result: {
          content: [
            { type: 'text', text: 'one' },
            { type: 'image' },
            { type: 'text' },
            { type: 'text', text: 'two' },
          ],
          isError: true,
        },
      }),
    );
    expect(await callTool(ENDPOINT, 't', 'getLead', { id: '1' })).toEqual({
      text: 'one\n\ntwo',
      isError: true,
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).params).toEqual({
      name: 'getLead',
      arguments: { id: '1' },
    });
    fetchMock.mockResolvedValueOnce(reply(200, { result: {} }));
    expect(await callTool(ENDPOINT, 't', 'x', {})).toEqual({ text: '', isError: false });
  });
});

describe('example arguments', () => {
  it('fills each required argument with a value of its type', () => {
    const example = exampleArgs({
      name: 'listDealsPaged',
      inputSchema: {
        properties: {
          page: { type: 'integer' },
          search: { type: 'string' },
          active: { type: 'boolean' },
          ids: { type: 'array' },
          filter: { type: 'object' },
          odd: { type: 'null' },
          untyped: {},
        },
        required: ['page', 'search', 'active', 'ids', 'filter', 'odd', 'untyped', 'missing'],
      },
    });
    expect(JSON.parse(example)).toEqual({
      page: 1,
      search: '',
      active: false,
      ids: [],
      filter: {},
      odd: '',
      untyped: '',
      missing: '',
    });
    expect(exampleArgs({ name: 'crmDashboard' })).toBe('{}');
  });
});

describe('the playground', () => {
  it('lists, filters, picks and runs a tool', async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, { result: { tools: [{ name: 'listLeads' }, { name: 'crmDashboard' }] } }),
    );
    const { result } = renderHookWithProviders(() => usePlayground(ENDPOINT, 'secret'));
    await act(() => result.current.load());
    expect(result.current.shown).toHaveLength(2);
    act(() => result.current.setFilter(' LEAD '));
    expect(result.current.shown.map((tool) => tool.name)).toEqual(['listLeads']);
    act(() => result.current.select('listLeads'));
    expect(result.current.selected?.name).toBe('listLeads');
    fetchMock.mockResolvedValueOnce(
      reply(200, { result: { content: [{ type: 'text', text: '[]' }] } }),
    );
    await act(() => result.current.run('listLeads', {}));
    expect(result.current.answer).toEqual({ text: '[]', isError: false });
    act(() => result.current.select('crmDashboard'));
    expect(result.current.answer).toBeNull();
  });

  it('shows why listing failed, and a failed run as an error answer', async () => {
    fetchMock.mockResolvedValueOnce(reply(401, {}));
    const { result } = renderHookWithProviders(() => usePlayground(ENDPOINT, 'old'));
    await act(() => result.current.load());
    expect(result.current.tools).toBeNull();
    expect(result.current.error).toMatch(/expired or was revoked/);
    fetchMock.mockRejectedValueOnce('offline');
    await act(() => result.current.load());
    expect(result.current.error).toBe('The tools could not be listed.');
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));
    await act(() => result.current.run('listLeads', {}));
    expect(result.current.answer).toEqual({ text: 'Failed to fetch', isError: true });
    fetchMock.mockRejectedValueOnce('offline');
    await act(() => result.current.run('listLeads', {}));
    expect(result.current.answer).toEqual({ text: 'The tool could not be run.', isError: true });
  });
});

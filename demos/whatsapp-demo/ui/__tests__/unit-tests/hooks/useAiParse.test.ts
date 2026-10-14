import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { AiRequest } from '@exyconn/wa-flow';
import { useAiParse } from '../../../src/hooks/useAiParse';

const api = vi.hoisted(() => ({
  status: undefined as unknown,
  statusOptions: undefined as unknown,
  parse: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', () => ({
  useWhatsappDemoAiStatusQuery: (options: unknown) => {
    api.statusOptions = options;
    return { data: api.status };
  },
  useWhatsappDemoParseMutation: () => [api.parse],
}));

const request: AiRequest = {
  workflow: 'booking',
  node: 'ask-date',
  text: 'next friday please',
  intents: [{ id: 'book', description: 'Wants an appointment' }],
  entities: [{ name: 'date', kind: 'date', description: 'Preferred day' }],
};

beforeEach(() => {
  api.status = undefined;
  api.parse.mockReset();
});

describe('useAiParse', () => {
  it('is not configured until the server says so', () => {
    const { result } = renderHook(() => useAiParse('s-1'));
    expect(result.current.configured).toBe(false);
    expect(api.statusOptions).toEqual({ fetchPolicy: 'cache-first' });
  });

  it.each([true, false])('reports configured = %s from the server', (configured) => {
    api.status = { whatsappDemoAiStatus: { configured } };
    const { result } = renderHook(() => useAiParse('s-1'));
    expect(result.current.configured).toBe(configured);
  });

  it("sends the text with the node's intents and entities for this session and demo", async () => {
    api.parse.mockResolvedValue({
      data: { whatsappDemoParse: { ok: true, intent: 'book', entities: { date: '2026-10-09' } } },
    });
    const { result } = renderHook(() => useAiParse('s-1'));
    await expect(result.current.read(request, 'clinic')).resolves.toEqual({
      intent: 'book',
      entities: { date: '2026-10-09' },
    });
    expect(api.parse).toHaveBeenCalledWith({
      variables: {
        input: {
          sessionId: 's-1',
          demoKey: 'clinic',
          workflow: 'booking',
          node: 'ask-date',
          text: 'next friday please',
          intents: request.intents,
          entities: request.entities,
        },
      },
    });
  });

  it('reads a reply with no intent or entities as none', async () => {
    api.parse.mockResolvedValue({
      data: { whatsappDemoParse: { ok: true, intent: null, entities: null } },
    });
    const { result } = renderHook(() => useAiParse('s-1'));
    await expect(result.current.read(request, 'clinic')).resolves.toEqual({
      intent: null,
      entities: {},
    });
  });

  it('answers null when the server could not read the text', async () => {
    api.parse.mockResolvedValue({
      data: { whatsappDemoParse: { ok: false, error: 'not set up' } },
    });
    const { result } = renderHook(() => useAiParse('s-1'));
    await expect(result.current.read(request, 'clinic')).resolves.toBeNull();
  });

  it('answers null when the reply carries no data', async () => {
    api.parse.mockResolvedValue({ data: undefined });
    const { result } = renderHook(() => useAiParse('s-1'));
    await expect(result.current.read(request, 'clinic')).resolves.toBeNull();
  });
});

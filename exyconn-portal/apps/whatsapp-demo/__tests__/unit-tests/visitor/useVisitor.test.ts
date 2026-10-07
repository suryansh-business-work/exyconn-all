import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVisitor } from '../../../src/visitor/useVisitor';

const api = vi.hoisted(() => ({
  held: false,
  result: { data: undefined as unknown, loading: false },
  options: undefined as unknown,
}));

vi.mock('../../../src/visitor/visitorPass', () => ({ hasVisitorPass: () => api.held }));
vi.mock('@exyconn/shell/graphql/generated', () => ({
  useWhatsappDemoVisitorMeQuery: (options: unknown) => {
    api.options = options;
    return api.result;
  },
}));

const meera = { id: 'v-1', name: 'Meera', email: 'meera@example.com' };

beforeEach(() => {
  api.held = false;
  api.result = { data: undefined, loading: false };
});

afterEach(() => {
  api.options = undefined;
});

describe('useVisitor', () => {
  it('does not ask the server, and is not loading, without a pass', () => {
    api.result = { data: undefined, loading: true };
    const { result } = renderHook(() => useVisitor());
    expect(api.options).toEqual({ skip: true, fetchPolicy: 'cache-first' });
    expect(result.current).toEqual({ visitor: null, loading: false });
  });

  it('is loading while a held pass is being checked', () => {
    api.held = true;
    api.result = { data: undefined, loading: true };
    const { result } = renderHook(() => useVisitor());
    expect(api.options).toEqual({ skip: false, fetchPolicy: 'cache-first' });
    expect(result.current).toEqual({ visitor: null, loading: true });
  });

  it('is the visitor the server recognises', () => {
    api.held = true;
    api.result = { data: { whatsappDemoVisitorMe: meera }, loading: false };
    expect(renderHook(() => useVisitor()).result.current).toEqual({
      visitor: meera,
      loading: false,
    });
  });

  it('is nobody when the server no longer honours the pass', () => {
    api.held = true;
    api.result = { data: { whatsappDemoVisitorMe: null }, loading: false };
    expect(renderHook(() => useVisitor()).result.current.visitor).toBeNull();
  });
});

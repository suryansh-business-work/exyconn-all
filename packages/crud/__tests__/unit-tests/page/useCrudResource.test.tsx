import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { useCrudResource, type UseCrudResourceOptions } from '../../../src/page/useCrudResource';
import { renderHookWithProviders, useSearch } from '../test-utils';

interface Lead {
  id: string;
  name: string;
}

const lead: Lead = { id: 'l1', name: 'Acme' };

const options = (overrides: Partial<UseCrudResourceOptions<Lead>> = {}) => ({
  label: 'Lead',
  onDelete: vi.fn(() => Promise.resolve(true)),
  confirmMessage: () => 'Delete this lead?',
  ...overrides,
});

const renderResource = (opts: UseCrudResourceOptions<Lead>, route = '/leads') =>
  renderHookWithProviders(() => ({ crud: useCrudResource<Lead>(opts), search: useSearch() }), {
    route,
  });

describe('useCrudResource dialog state', () => {
  it('starts closed and opens the create form in the URL', () => {
    const { result } = renderResource(options());
    expect(result.current.crud.open).toBe(false);
    expect(result.current.crud.refreshSignal).toBe(0);

    act(() => result.current.crud.openCreate());
    expect(result.current.search).toBe('?form=new');
    expect(result.current.crud.open).toBe(true);
    expect(result.current.crud.editing).toBeNull();
  });

  it('opens a row for editing under its own scope, and closes again', () => {
    const { result } = renderResource(options({ scope: 'x' }));
    act(() => result.current.crud.openEdit(lead));
    expect(result.current.search).toBe('?form-x=edit');
    expect(result.current.crud.editing).toEqual(lead);

    act(() => result.current.crud.close());
    expect(result.current.search).toBe('');
    expect(result.current.crud.open).toBe(false);
  });

  it('reloads and closes when the form is done', async () => {
    const refetch = vi.fn(() => Promise.resolve());
    const { result } = renderResource(options({ refetch }), '/leads?form=new');
    expect(result.current.crud.open).toBe(true);

    act(() => result.current.crud.onDone());
    expect(result.current.crud.refreshSignal).toBe(1);
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(result.current.search).toBe('');
  });

  it('bumps the refresh signal even with no page query to refetch', () => {
    const { result } = renderResource(options());
    act(() => result.current.crud.reload());
    act(() => result.current.crud.reload());
    expect(result.current.crud.refreshSignal).toBe(2);
  });

  it('reports a failed refetch', async () => {
    const refetch = vi.fn(() => Promise.reject(new Error('Stats unavailable')));
    const { result } = renderResource(options({ refetch }));
    act(() => result.current.crud.reload());
    expect(await screen.findByText('Stats unavailable')).toBeInTheDocument();
  });

  it('reports a refetch failure that is not an Error with a general message', async () => {
    const notAnError: unknown = 'offline';
    const refetch = vi.fn(() => Promise.reject(notAnError));
    const { result } = renderResource(options({ refetch }));
    act(() => result.current.crud.reload());
    expect(await screen.findByText('Reload failed')).toBeInTheDocument();
  });
});

import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useCrudDialog } from '@/hooks/useCrudDialog';

interface Row {
  id: string;
}

/** The hook plus the URL it drives, so a test can assert on both. */
function useSubject() {
  return { crud: useCrudDialog<Row>(), search: useLocation().search };
}

function render(initialEntry = '/leads') {
  return renderHook(useSubject, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    ),
  });
}

describe('useCrudDialog', () => {
  it('starts closed on a plain list URL', () => {
    const { result } = render();
    expect(result.current.crud.open).toBe(false);
    expect(result.current.search).toBe('');
  });

  it('puts the create form in the URL so Back leaves it', () => {
    const { result } = render();
    act(() => result.current.crud.openCreate());
    expect(result.current.crud.open).toBe(true);
    expect(result.current.crud.editing).toBeNull();
    expect(result.current.search).toBe('?form=new');
  });

  it('holds the row being edited alongside the URL flag', () => {
    const { result } = render();
    act(() => result.current.crud.openEdit({ id: 'lead-1' }));
    expect(result.current.crud.open).toBe(true);
    expect(result.current.crud.editing).toEqual({ id: 'lead-1' });
    expect(result.current.search).toBe('?form=edit');
  });

  it('clears the flag and the row on close', () => {
    const { result } = render();
    act(() => result.current.crud.openEdit({ id: 'lead-1' }));
    act(() => result.current.crud.close());
    expect(result.current.crud.open).toBe(false);
    expect(result.current.crud.editing).toBeNull();
    expect(result.current.search).toBe('');
  });

  it('keeps the list’s other params when the form opens and closes', () => {
    const { result } = render('/leads?tab=open');
    act(() => result.current.crud.openCreate());
    expect(result.current.search).toBe('?tab=open&form=new');
    act(() => result.current.crud.close());
    expect(result.current.search).toBe('?tab=open');
  });

  it('drops a reloaded edit URL that has no row behind it', () => {
    const { result } = render('/leads?form=edit');
    expect(result.current.crud.open).toBe(false);
    expect(result.current.search).toBe('');
  });
});

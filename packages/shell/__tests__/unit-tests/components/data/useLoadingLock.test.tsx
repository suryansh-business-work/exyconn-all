import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useLoadingLock } from '@/components/data/useLoadingLock';

type Lock = ReturnType<typeof useLoadingLock>;

/** A container with a search box inside it, as a grid has, and a button outside it. */
function Harness({ onLock }: Readonly<{ onLock: (lock: Lock) => void }>) {
  const lock = useLoadingLock();
  onLock(lock);
  return (
    <>
      <div ref={lock.containerRef} data-loading={String(lock.loading)}>
        <input aria-label="search" />
      </div>
      <button type="button">outside</button>
    </>
  );
}

function setup() {
  const ref: { current: Lock | null } = { current: null };
  render(
    <Harness
      onLock={(lock) => {
        ref.current = lock;
      }}
    />,
  );
  const lock = () => {
    if (!ref.current) throw new Error('not rendered');
    return ref.current;
  };
  const loading = () => screen.getByLabelText('search').parentElement?.dataset.loading;
  return { lock, loading };
}

describe('useLoadingLock', () => {
  it('stays locked until every overlapping request has ended', () => {
    const { lock, loading } = setup();
    expect(loading()).toBe('false');

    act(() => lock().begin());
    act(() => lock().begin());
    expect(loading()).toBe('true');

    act(() => lock().end());
    expect(loading()).toBe('true');
    act(() => lock().end());
    expect(loading()).toBe('false');
  });

  it('never counts below zero when end is called too often', () => {
    const { lock, loading } = setup();
    act(() => lock().end());
    act(() => lock().begin());
    expect(loading()).toBe('true');
    act(() => lock().end());
    expect(loading()).toBe('false');
  });

  it('gives focus back to the control inside the grid that held it', () => {
    const { lock } = setup();
    const search = screen.getByLabelText('search');
    search.focus();

    act(() => lock().begin());
    search.blur();
    expect(document.activeElement).not.toBe(search);
    act(() => lock().end());

    expect(document.activeElement).toBe(search);
  });

  it('leaves focus alone when it was outside the grid', () => {
    const { lock } = setup();
    const outside = screen.getByRole('button', { name: 'outside' });
    outside.focus();

    act(() => lock().begin());
    outside.blur();
    act(() => lock().end());

    expect(document.activeElement).toBe(document.body);
  });

  it('does not refocus a control that has left the page', () => {
    const { lock } = setup();
    const search = screen.getByLabelText('search');
    search.focus();

    act(() => lock().begin());
    search.remove();
    act(() => lock().end());

    expect(document.activeElement).toBe(document.body);
  });
});

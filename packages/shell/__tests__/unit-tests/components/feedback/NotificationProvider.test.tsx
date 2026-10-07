import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { AlertColor } from '@exyconn/ui';
import { I18nProvider, type Interpolations } from '@exyconn/i18n';
import { NotificationProvider, useNotify } from '@/components/feedback/NotificationProvider';

interface NotifyCall {
  message: string;
  severity?: AlertColor;
  values?: Interpolations;
}

function Notifier({ call }: Readonly<{ call: NotifyCall }>) {
  const notify = useNotify();
  return (
    <button type="button" onClick={() => notify(call.message, call.severity, call.values)}>
      notify
    </button>
  );
}

function renderNotifier(call: NotifyCall, messages: Record<string, string> = {}) {
  render(
    <I18nProvider locale="en" messages={messages}>
      <NotificationProvider>
        <Notifier call={call} />
      </NotificationProvider>
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'notify' }));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('NotificationProvider', () => {
  it('shows a translated success message by default and hides it after four seconds', () => {
    vi.useFakeTimers();
    renderNotifier(
      { message: 'Invoice {number} drafted', values: { number: 'INV-7' } },
      { 'Invoice {number} drafted': 'Factura {number} creada' },
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Factura INV-7 creada');
    expect(alert).toHaveClass('MuiAlert-colorSuccess');

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(screen.queryByText('Factura INV-7 creada')).not.toBeInTheDocument();
  });

  it('keeps an error on screen until it is dismissed', () => {
    vi.useFakeTimers();
    renderNotifier({ message: 'Could not save', severity: 'error' });

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not save');
    expect(alert).toHaveClass('MuiAlert-colorError');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(screen.queryByText('Could not save')).not.toBeInTheDocument();
  });
});

describe('useNotify', () => {
  it('refuses to run outside a NotificationProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useNotify())).toThrow(
      'useNotify must be used within a NotificationProvider',
    );
    vi.restoreAllMocks();
  });
});

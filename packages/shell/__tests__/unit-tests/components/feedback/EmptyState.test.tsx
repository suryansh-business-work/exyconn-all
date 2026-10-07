import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@exyconn/i18n';
import type { ReactElement } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CenteredState, LoadingState } from '@/components/feedback/CenteredState';

function renderIn(ui: ReactElement, messages: Record<string, string> = {}) {
  return render(
    <I18nProvider locale="en" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

describe('EmptyState', () => {
  it('names what is missing with the default tray icon and no extras', () => {
    const { container } = renderIn(<EmptyState title="No leads yet" />);

    expect(screen.getByText('No leads yet')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="InboxOutlinedIcon"]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('translates title and description and offers the next step', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderIn(
      <EmptyState
        title="No {kind} yet"
        titleValues={{ kind: 'leads' }}
        description="Add {count} to start"
        descriptionValues={{ count: 'one' }}
        actionLabel="Add lead"
        onAction={onAction}
        icon={<span data-testid="custom-icon" />}
      />,
      { 'Add lead': 'Añadir cliente' },
    );

    expect(screen.getByText('No leads yet')).toBeInTheDocument();
    expect(screen.getByText('Add one to start')).toBeInTheDocument();
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Añadir cliente' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows no button when there is a label but nothing to do', () => {
    renderIn(<EmptyState title="Empty" actionLabel="Add" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('CenteredState and LoadingState', () => {
  it('fills a flex column only when asked to', () => {
    const { rerender } = renderIn(<CenteredState>plain</CenteredState>);
    expect(getComputedStyle(screen.getByText('plain')).flexGrow).not.toBe('1');

    rerender(
      <I18nProvider locale="en" messages={{}}>
        <CenteredState fill>filled</CenteredState>
      </I18nProvider>,
    );
    expect(getComputedStyle(screen.getByText('filled')).flexGrow).toBe('1');
  });

  it('announces a translated loading label politely', () => {
    renderIn(<LoadingState label="Fetching" />, { Fetching: 'Cargando' });

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('progressbar', { name: 'Cargando' })).toBeInTheDocument();
  });

  it('says Loading by default', () => {
    renderIn(<LoadingState />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
  });
});

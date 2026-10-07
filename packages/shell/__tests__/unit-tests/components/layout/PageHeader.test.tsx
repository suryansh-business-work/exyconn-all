import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageHeader } from '@/components/layout/PageHeader';
import { renderWithProviders } from '../../test-utils';

describe('PageHeader', () => {
  it('renders the translated title as the page h1 and titles the tab with it', () => {
    renderWithProviders(
      <PageHeader
        title="Hello, {name}"
        titleValues={{ name: 'Asha' }}
        subtitle="{count} tasks due"
        subtitleValues={{ count: 3 }}
      />,
      { messages: { 'Hello, {name}': 'Hola, {name}' } },
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Hola, Asha' })).toBeInTheDocument();
    expect(screen.getByText('3 tasks due')).toBeInTheDocument();
    expect(document.title).toMatch(/^Hola, Asha/);
  });

  it('shows the primary action only with both a label and a handler', async () => {
    const onAction = vi.fn();
    const { rerender } = renderWithProviders(
      <PageHeader title="Leads" actionLabel="New {kind}" actionLabelValues={{ kind: 'lead' }} />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<PageHeader title="Leads" onAction={onAction} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <PageHeader
        title="Leads"
        actionLabel="New {kind}"
        actionLabelValues={{ kind: 'lead' }}
        onAction={onAction}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'New lead' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders extra controls and no subtitle when none is given', () => {
    renderWithProviders(
      <PageHeader title="Reports">
        <span>Filters</span>
      </PageHeader>,
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 }).parentElement?.children).toHaveLength(1);
  });
});

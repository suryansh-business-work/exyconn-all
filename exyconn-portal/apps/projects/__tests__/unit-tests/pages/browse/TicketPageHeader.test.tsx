import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskPriority, TaskType, TaskVisibility } from '@exyconn/shell/graphql/generated';
import { TicketPageHeader } from '../../../../src/pages/browse/TicketPageHeader';
import { renderWithProviders } from '../../test-utils';
import { pageTicket } from './browse-fixtures';

function renderHeader(ticket = pageTicket(), projectName = 'Website') {
  const handlers = { onBack: vi.fn(), onCopyLink: vi.fn(), onShare: vi.fn(), onDelete: vi.fn() };
  renderWithProviders(<TicketPageHeader ticket={ticket} projectName={projectName} {...handlers} />);
  return handlers;
}

describe('TicketPageHeader', () => {
  it('names the project, the key, type, priority and title of a private ticket', () => {
    renderHeader(pageTicket({ type: TaskType.Story, priority: TaskPriority.Low }));

    expect(screen.getByRole('button', { name: 'Website' })).toBeInTheDocument();
    expect(screen.getByText('EXY-1')).toBeInTheDocument();
    expect(screen.getByText('Story')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Priority: Low' })).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Login fails' })).toBeInTheDocument();
  });

  it('marks a public ticket, and falls back to "Project" without a project name', () => {
    renderHeader(pageTicket({ visibility: TaskVisibility.Public }), '');

    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Project' })).toBeInTheDocument();
  });

  it('goes back, copies the link, shares and deletes', async () => {
    const handlers = renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Website' }));
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(handlers.onBack).toHaveBeenCalledTimes(1);
    expect(handlers.onCopyLink).toHaveBeenCalledTimes(1);
    expect(handlers.onShare).toHaveBeenCalledTimes(1);
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });
});

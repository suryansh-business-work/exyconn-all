import { fireEvent, screen } from '@testing-library/react';
import type { TrackerProject, TrackerTask } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ProjectPicker } from '../../../../src/components/dashboard/ProjectPicker';
import { TicketPicker } from '../../../../src/components/dashboard/TicketPicker';
import { tracker } from '../../../../src/tracker/instance';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { setProject: vi.fn(), setTask: vi.fn() },
}));

const PROJECTS: TrackerProject[] = [
  { id: 'p1', name: 'Global Project', key: 'GLB' },
  { id: 'p2', name: 'Website', key: 'WEB' },
];

const TASKS: TrackerTask[] = [
  { id: 't1', key: 'WEB-1', title: 'Fix header', assignedToMe: false },
  { id: 't2', key: 'WEB-2', title: 'Ship pricing', assignedToMe: true },
];

function field(name: RegExp): HTMLElement {
  return screen.getByRole('button', { name });
}

describe('ProjectPicker', () => {
  it('shows the booked project and books the next session to another', () => {
    renderWithProviders(
      <ProjectPicker projects={PROJECTS} selectedProjectId="p2" disabled={false} loading={false} />,
    );
    fireEvent.click(field(/^Project: Website$/));
    expect(screen.queryByPlaceholderText('Search')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Global Project' }));
    expect(tracker.setProject).toHaveBeenCalledWith('p1');
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('marks the booked project as the chosen one in the list', () => {
    renderWithProviders(
      <ProjectPicker projects={PROJECTS} selectedProjectId="p2" disabled={false} loading={false} />,
    );
    fireEvent.click(field(/^Project: Website$/));
    expect(screen.getByRole('radio', { name: 'Website' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Global Project' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('waits on the portal with a spinner and no presses', () => {
    renderWithProviders(
      <ProjectPicker projects={[]} selectedProjectId="" disabled={false} loading />,
    );
    const button = field(/^Project: Choose a project$/);
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading projects…')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('says there is nothing to book to when the workspace has no projects', () => {
    renderWithProviders(
      <ProjectPicker projects={[]} selectedProjectId="" disabled={false} loading={false} />,
    );
    expect(field(/^Project: No projects yet$/)).toHaveAttribute('aria-disabled', 'true');
  });

  it('locks the booking while a session is running', () => {
    renderWithProviders(
      <ProjectPicker projects={PROJECTS} selectedProjectId="p1" disabled loading={false} />,
    );
    expect(field(/^Project: Global Project$/)).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByText('Locked while tracking — stop to book to another project.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('icon-lock-outline')).toBeInTheDocument();
  });

  it('offers a search box once the list is long', () => {
    const many = Array.from({ length: 9 }, (_unused, index) => ({
      id: `p${index}`,
      name: `Project ${index}`,
      key: `P${index}`,
    }));
    renderWithProviders(
      <ProjectPicker projects={many} selectedProjectId="p0" disabled={false} loading={false} />,
    );
    fireEvent.click(field(/^Project: Project 0$/));
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });
});

describe('TicketPicker', () => {
  it('defaults to no ticket and lists the employee’s own tickets first', () => {
    renderWithProviders(
      <TicketPicker tasks={TASKS} selectedTaskId="" disabled={false} loading={false} />,
    );
    expect(screen.getByText('Optional.')).toBeInTheDocument();
    fireEvent.click(field(/^Ticket: No ticket$/));
    const names = screen.getAllByRole('radio').map((row) => row.getAttribute('aria-label'));
    expect(names).toEqual(['No ticket', 'WEB-2 · Ship pricing', 'WEB-1 · Fix header']);
    expect(screen.getByText('Assigned to me')).toBeInTheDocument();
  });

  it('books the next session to the chosen ticket', () => {
    renderWithProviders(
      <TicketPicker tasks={TASKS} selectedTaskId="t1" disabled={false} loading={false} />,
    );
    fireEvent.click(field(/^Ticket: WEB-1 · Fix header$/));
    fireEvent.click(screen.getByRole('radio', { name: 'WEB-2 · Ship pricing' }));
    expect(tracker.setTask).toHaveBeenCalledWith('t2');
  });

  it('finds a ticket by what is typed into the search box', () => {
    renderWithProviders(
      <TicketPicker tasks={TASKS} selectedTaskId="" disabled={false} loading={false} />,
    );
    fireEvent.click(field(/^Ticket: No ticket$/));
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'pricing' } });
    expect(screen.getAllByRole('radio')).toHaveLength(1);
    expect(screen.getByRole('radio', { name: 'WEB-2 · Ship pricing' })).toBeInTheDocument();
  });

  it('says when the tickets are still loading', () => {
    renderWithProviders(<TicketPicker tasks={[]} selectedTaskId="" disabled={false} loading />);
    expect(screen.getByText('Loading tickets…')).toBeInTheDocument();
    expect(field(/^Ticket: No ticket$/)).toHaveAttribute('aria-busy', 'true');
  });

  it('locks the ticket while a session is running', () => {
    renderWithProviders(<TicketPicker tasks={TASKS} selectedTaskId="" disabled loading={false} />);
    expect(
      screen.getByText('Locked while tracking — stop to book to another ticket.'),
    ).toBeInTheDocument();
    expect(field(/^Ticket: No ticket$/)).toHaveAttribute('aria-disabled', 'true');
  });
});

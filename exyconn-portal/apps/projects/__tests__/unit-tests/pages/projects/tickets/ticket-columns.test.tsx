import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TaskPriority, TaskType } from '@exyconn/shell/graphql/generated';
import { ticketColumns } from '../../../../../src/pages/projects/tickets';
import type { TicketRow } from '../../../../../src/pages/projects/forms/ticket';
import { renderWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';

type Translate = Parameters<typeof ticketColumns>[1];

const t: Translate = (source) => `[${source}]`;
const COLUMNS = ticketColumns((value) => `due ${value.slice(0, 10)}`, t);

/** What one column draws for a row, mounted so its icons and chips render. */
function renderCell(key: string, row: TicketRow) {
  const column = COLUMNS.find((candidate) => candidate.key === key);
  if (!column?.render) throw new Error(`Column ${key} has no renderer`);
  const cell: ReactNode = column.render(row);
  return renderWithProviders(<div data-testid="cell">{cell}</div>);
}

describe('ticketColumns', () => {
  it('lays out the ticket list columns, summary drawn as plain text', () => {
    expect(COLUMNS.map((column) => [column.key, column.label])).toEqual([
      ['key', 'Key'],
      ['type', 'Type'],
      ['title', 'Summary'],
      ['priority', 'Priority'],
      ['assigneeName', 'Assignee'],
      ['storyPoints', 'Points'],
      ['labels', 'Labels'],
      ['dueDate', 'Due'],
    ]);
    expect(COLUMNS.find((column) => column.key === 'title')?.render).toBeUndefined();
  });

  it('shows the key, and the type and priority by their translated names', () => {
    const row = taskRow({ type: TaskType.Story, priority: TaskPriority.Lowest });

    renderCell('key', row);
    expect(screen.getByText('EXY-1')).toBeInTheDocument();
    renderCell('type', row);
    expect(screen.getByText('[Story]')).toBeInTheDocument();
    renderCell('priority', row);
    expect(screen.getByText('[Lowest]')).toBeInTheDocument();
  });

  it('shows the assignee with initials, or says the ticket is unassigned', () => {
    renderCell('assigneeName', taskRow({ assigneeName: 'Priya Nair' }));
    expect(screen.getByText('Priya Nair')).toBeInTheDocument();
    expect(screen.getByText('PN')).toBeInTheDocument();

    renderCell('assigneeName', taskRow({ assigneeName: '' }));
    expect(screen.getByText('[Unassigned]')).toBeInTheDocument();
  });

  it('writes points, keeping a real zero and a dash for an unsized ticket', () => {
    const points = COLUMNS.find((column) => column.key === 'storyPoints')?.render;

    expect(points?.(taskRow({ storyPoints: 5 }))).toBe('5');
    expect(points?.(taskRow({ storyPoints: 0 }))).toBe('0');
    expect(points?.(taskRow({ storyPoints: null }))).toBe('—');
  });

  it('draws each label as a chip, and a dash when there are none', () => {
    renderCell('labels', taskRow({ labels: ['frontend', 'urgent'] }));
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();

    const labels = COLUMNS.find((column) => column.key === 'labels')?.render;
    expect(labels?.(taskRow({ labels: [] }))).toBe('—');
  });

  it('writes the due date in the viewer format, or a dash', () => {
    const due = COLUMNS.find((column) => column.key === 'dueDate')?.render;

    expect(due?.(taskRow({ dueDate: '2026-10-20T00:00:00.000Z' }))).toBe('due 2026-10-20');
    expect(due?.(taskRow({ dueDate: null }))).toBe('—');
  });
});

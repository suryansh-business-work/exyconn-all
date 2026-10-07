import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DepartmentCard } from '../../../../../src/pages/hr/departments/DepartmentCard';
import type { DepartmentRow } from '../../../../../src/pages/hr/forms/department';
import { renderWithProviders } from '../../../test-utils';
import { engineer, engineering, intern, sales } from '../departments-fixture';

function renderCard(department: DepartmentRow) {
  const handlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddPosition: vi.fn(),
    onEditPosition: vi.fn(),
    onDeletePosition: vi.fn(),
  };
  renderWithProviders(<DepartmentCard department={department} {...handlers} />);
  return handlers;
}

/** Opens the accordion, so its details are on screen. */
async function expand(name: string) {
  await userEvent.click(screen.getByText(name));
  return screen.findByRole('button', { name: 'Add position' });
}

const rowOf = (text: string) => screen.getByText(text).closest('tr') as HTMLElement;

describe('DepartmentCard summary', () => {
  it('names the head, the code, the positions and how many seats are filled', () => {
    renderCard(engineering);
    expect(screen.getByText('ENG')).toBeInTheDocument();
    expect(
      screen.getByText('Head: Maya Iyer · Positions: 2 · 3 of 5 seats filled'),
    ).toBeInTheDocument();
  });

  it('leaves out the head and the code when the department has none', () => {
    renderCard(sales);
    expect(screen.getByText('Positions: 0 · 0 of 0 seats filled')).toBeInTheDocument();
    expect(screen.queryByText('ENG')).not.toBeInTheDocument();
  });
});

describe('DepartmentCard details', () => {
  it('shows the description and each position with its band, grade, type and seats', async () => {
    renderCard(engineering);
    await expand('Engineering');
    expect(screen.getByText('Everyone who builds')).toBeInTheDocument();

    const cells = within(rowOf('Software Engineer'))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells.slice(0, 7)).toEqual([
      'Software Engineer',
      'SE2',
      '50,000 – 90,000',
      'G3',
      'FULL_TIME',
      '2 / 3',
      'OPEN',
    ]);
  });

  it('writes a dash for a position with nothing optional set, and shows it closed', async () => {
    renderCard(engineering);
    await expand('Engineering');
    const cells = within(rowOf('Intern'))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells.slice(0, 7)).toEqual([
      'Intern',
      '—',
      '10,000 – 15,000',
      '—',
      '—',
      '1 / 2',
      'CLOSED',
    ]);
  });

  it('says so when the department has no positions and no description', async () => {
    renderCard(sales);
    await expand('Sales');
    expect(screen.getByText('No positions in this department yet.')).toBeInTheDocument();
    expect(screen.queryByText('Everyone who builds')).not.toBeInTheDocument();
  });

  it('adds a position to this department by name', async () => {
    const handlers = renderCard(engineering);
    await userEvent.click(await expand('Engineering'));
    expect(handlers.onAddPosition).toHaveBeenCalledWith('Engineering');
  });

  it('edits and deletes the department itself', async () => {
    const handlers = renderCard(engineering);
    await expand('Engineering');
    await userEvent.click(screen.getByRole('button', { name: 'Edit department' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete department' }));
    expect(handlers.onEdit).toHaveBeenCalledWith(engineering);
    expect(handlers.onDelete).toHaveBeenCalledWith(engineering);
  });

  it('edits and deletes one of its positions', async () => {
    const handlers = renderCard(engineering);
    await expand('Engineering');
    await userEvent.click(within(rowOf('Software Engineer')).getByRole('button', { name: 'edit' }));
    await userEvent.click(within(rowOf('Intern')).getByRole('button', { name: 'delete' }));
    expect(handlers.onEditPosition).toHaveBeenCalledWith(engineer);
    expect(handlers.onDeletePosition).toHaveBeenCalledWith(intern);
  });
});

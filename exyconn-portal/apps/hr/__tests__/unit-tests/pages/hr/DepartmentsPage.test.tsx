import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useDeleteDepartmentMutation,
  useDeletePositionMutation,
  useListDepartmentsQuery,
} from '@exyconn/shell/graphql/generated';
import { DepartmentsPage } from '../../../../src/pages/hr';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple, queryResult } from '../../harness/gql-doubles';
import { engineer, engineering, sales } from './departments-fixture';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListDepartmentsQuery: vi.fn(),
  useDeleteDepartmentMutation: vi.fn(),
  useDeletePositionMutation: vi.fn(),
}));

vi.mock('../../../../src/pages/hr/forms/department', async () => ({
  DepartmentForm: (await import('../../harness/form-stub')).FormStub,
}));

vi.mock('../../../../src/pages/hr/forms/position', async () => ({
  PositionForm: (await import('../../harness/position-form-stub')).PositionFormStub,
}));

const refetch = vi.fn();
const removeDepartment = vi.fn();
const removePosition = vi.fn();

function answer(data: unknown, loading = false) {
  vi.mocked(useListDepartmentsQuery).mockReturnValue(
    queryResult(data, { loading, refetch }) as never,
  );
}

/** Opens the Engineering card; its buttons are looked up inside it, never in another card. */
async function expandEngineering() {
  const title = screen.getByText('Engineering');
  await userEvent.click(title);
  const card = within(title.closest('.MuiAccordion-root') as HTMLElement);
  await card.findByRole('button', { name: 'Add position' });
  return card;
}

beforeEach(() => {
  refetch.mockReset().mockResolvedValue({});
  removeDepartment.mockReset().mockResolvedValue({ data: {} });
  removePosition.mockReset().mockResolvedValue({ data: {} });
  answer({ listDepartments: [engineering, sales] });
  vi.mocked(useDeleteDepartmentMutation).mockReturnValue(mutationTuple(removeDepartment) as never);
  vi.mocked(useDeletePositionMutation).mockReturnValue(mutationTuple(removePosition) as never);
});

describe('DepartmentsPage list', () => {
  it('shows a card per department', () => {
    renderWithProviders(<DepartmentsPage />);
    expect(screen.getByRole('heading', { name: 'Departments' })).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.queryByText('No departments yet.')).not.toBeInTheDocument();
  });

  it('shows a spinner, not an empty note, before the first answer', () => {
    answer(undefined, true);
    renderWithProviders(<DepartmentsPage />);
    expect(screen.getByRole('progressbar', { name: 'Loading departments' })).toBeInTheDocument();
    expect(screen.queryByText('No departments yet.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();
  });

  it('keeps the cards on screen while they refresh', () => {
    answer({ listDepartments: [sales] }, true);
    renderWithProviders(<DepartmentsPage />);
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('says so when there are no departments', () => {
    answer({ listDepartments: [] });
    renderWithProviders(<DepartmentsPage />);
    expect(screen.getByText('No departments yet.')).toBeInTheDocument();
  });

  it('refreshes the departments on request', async () => {
    renderWithProviders(<DepartmentsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a refresh that failed', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('offline');
    refetch.mockRejectedValueOnce(failure);
    renderWithProviders(<DepartmentsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith('Could not refresh departments', failure),
    );
    logged.mockRestore();
  });
});

describe('DepartmentsPage departments', () => {
  it('creates a department in a page of its own and goes back', async () => {
    renderWithProviders(<DepartmentsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'New department' }));
    expect(screen.getByRole('heading', { name: 'New department' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to Departments' }));
    expect(screen.getByRole('heading', { name: 'Departments' })).toBeInTheDocument();
  });

  it('edits a department and reloads once it is saved', async () => {
    renderWithProviders(<DepartmentsPage />);
    const card = await expandEngineering();
    await userEvent.click(card.getByRole('button', { name: 'Edit department' }));
    expect(screen.getByRole('heading', { name: 'Edit department' })).toBeInTheDocument();
    expect(screen.getByText(`Form for ${JSON.stringify(engineering)}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.getByRole('heading', { name: 'Departments' })).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a department by id once the named prompt is confirmed', async () => {
    renderWithProviders(<DepartmentsPage />);
    const card = await expandEngineering();
    await userEvent.click(card.getByRole('button', { name: 'Delete department' }));
    expect(await screen.findByText('Delete department "Engineering"?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Department deleted')).toBeInTheDocument();
    expect(removeDepartment).toHaveBeenCalledWith({ variables: { id: 'dep-1' } });
  });
});

describe('DepartmentsPage positions', () => {
  it('adds a position to the department it was started from', async () => {
    renderWithProviders(<DepartmentsPage />);
    const card = await expandEngineering();
    await userEvent.click(card.getByRole('button', { name: 'Add position' }));
    expect(screen.getByRole('heading', { name: 'New position' })).toBeInTheDocument();
    expect(screen.getByText('Position form for nothing in "Engineering"')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel position form' }));
    expect(screen.getByRole('heading', { name: 'Departments' })).toBeInTheDocument();
  });

  it('edits a position and reloads once it is saved', async () => {
    renderWithProviders(<DepartmentsPage />);
    await expandEngineering();
    const row = screen.getByText('Software Engineer').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'edit' }));
    expect(screen.getByRole('heading', { name: 'Edit position' })).toBeInTheDocument();
    expect(
      screen.getByText(`Position form for ${JSON.stringify(engineer)} in ""`),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish position form' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a position by id once the named prompt is confirmed', async () => {
    renderWithProviders(<DepartmentsPage />);
    await expandEngineering();
    const row = screen.getByText('Software Engineer').closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'delete' }));
    expect(await screen.findByText('Delete position "Software Engineer"?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Position deleted')).toBeInTheDocument();
    expect(removePosition).toHaveBeenCalledWith({ variables: { id: 'pos-1' } });
  });
});

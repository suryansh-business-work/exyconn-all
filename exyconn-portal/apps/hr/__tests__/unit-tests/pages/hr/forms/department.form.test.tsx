import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  useCreateDepartmentMutation,
  useListEmployeeOptionsQuery,
  useUpdateDepartmentMutation,
} from '@exyconn/shell/graphql/generated';
import { DepartmentForm } from '../../../../../src/pages/hr/forms/department';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../../../harness/gql-doubles';
import { chooseOption, combobox, fillField, press } from '../../../harness/form-fields';
import { engineering, sales } from '../departments-fixture';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateDepartmentMutation: vi.fn(),
  useUpdateDepartmentMutation: vi.fn(),
  useListEmployeeOptionsQuery: vi.fn(),
}));

const HEAD = 'Head of department (optional)';
const create = vi.fn();
const update = vi.fn();

function renderForm(initial: typeof engineering | null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<DepartmentForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreateDepartmentMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdateDepartmentMutation).mockReturnValue(mutationTuple(update) as never);
  vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(
    queryResult({
      listEmployeeOptions: [
        { id: 'u1', name: 'Maya Iyer', email: 'maya@example.com' },
        { id: 'u2', name: 'Ravi Shah', email: 'ravi@example.com' },
      ],
    }) as never,
  );
});

describe('DepartmentForm — creating', () => {
  it('waits for the people before it can show a head', () => {
    vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderForm(null);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
  });

  it('creates a department with its head, sending empty optional fields as null', async () => {
    const { onDone } = renderForm(null);
    expect(screen.queryByText(/Renaming moves/)).not.toBeInTheDocument();
    await fillField('Department name', '  Engineering ');
    await chooseOption(HEAD, 'Ravi Shah');
    await press('Create');

    expect(await screen.findByText('Department created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: { input: { name: 'Engineering', code: null, description: '', headId: 'u2' } },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sends the code and description it was given, without a head', async () => {
    renderForm(null);
    await fillField('Department name', 'Sales');
    await fillField('Code (optional)', 'SAL');
    await fillField('Description (optional)', 'Closes deals');
    await press('Create');

    await screen.findByText('Department created');
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: { name: 'Sales', code: 'SAL', description: 'Closes deals', headId: null },
      },
    });
  });

  it('needs a name and keeps the code and description short', async () => {
    renderForm(null);
    await press('Create');
    expect(await screen.findByText('Name is required')).toBeInTheDocument();

    await fillField('Code (optional)', 'ABCDEFGHIJKLM');
    await fillField('Description (optional)', 'x'.repeat(201));
    await press('Create');
    expect(await screen.findByText('Keep the code under 12 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the description under 200 characters')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('says why a save failed and stays open', async () => {
    create.mockRejectedValueOnce(new Error('Name already taken'));
    const { onDone } = renderForm(null);
    await fillField('Department name', 'Sales');
    await press('Create');
    expect(await screen.findByText('Name already taken')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('offers no heads when the people list never arrived, and cancels', async () => {
    vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(undefined) as never);
    const { onCancel } = renderForm(null);
    expect(combobox(HEAD)).toHaveValue('');
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('DepartmentForm — editing', () => {
  it('opens on the department, warns about renames and updates it by id', async () => {
    const { onDone } = renderForm(engineering);
    expect(screen.getByRole('textbox', { name: 'Department name' })).toHaveValue('Engineering');
    expect(combobox(HEAD)).toHaveValue('Maya Iyer');
    expect(
      screen.getByText('Renaming moves its positions and employees along with it.'),
    ).toBeInTheDocument();

    await fillField('Code (optional)', 'R&D');
    await press('Update');

    expect(await screen.findByText('Department updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'dep-1',
        input: {
          name: 'Engineering',
          code: 'R&D',
          description: 'Everyone who builds',
          headId: 'u1',
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('opens a bare department with empty fields', () => {
    renderForm(sales);
    expect(screen.getByRole('textbox', { name: 'Code (optional)' })).toHaveValue('');
    expect(combobox(HEAD)).toHaveValue('');
  });
});

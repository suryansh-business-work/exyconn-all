import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useCreatePositionMutation,
  useListDepartmentsQuery,
  useListEmploymentTypesQuery,
  useListGradesQuery,
  useUpdatePositionMutation,
} from '@exyconn/shell/graphql/generated';
import { PositionForm } from '../../../../../src/pages/hr/forms/position';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../../../harness/gql-doubles';
import {
  chooseOption,
  combobox,
  fillField,
  optionsOf,
  press,
  setNumber,
} from '../../../harness/form-fields';
import { engineer, engineering, sales } from '../departments-fixture';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreatePositionMutation: vi.fn(),
  useUpdatePositionMutation: vi.fn(),
  useListDepartmentsQuery: vi.fn(),
  useListGradesQuery: vi.fn(),
  useListEmploymentTypesQuery: vi.fn(),
}));

const create = vi.fn();
const update = vi.fn();

function answerOptions(loading = false) {
  const answer = (data: unknown) => queryResult(loading ? undefined : data, { loading }) as never;
  vi.mocked(useListDepartmentsQuery).mockReturnValue(
    answer({ listDepartments: [engineering, sales] }),
  );
  vi.mocked(useListGradesQuery).mockReturnValue(
    answer({
      listGrades: [
        { code: 'G3', name: 'Grade 3', active: true },
        { code: 'G0', name: 'Retired grade', active: false },
      ],
    }),
  );
  vi.mocked(useListEmploymentTypesQuery).mockReturnValue(
    answer({ listEmploymentTypes: [{ code: 'FT', name: 'Full time', active: true }] }),
  );
}

function renderForm(initial: typeof engineer | null, department = 'Engineering') {
  const onDone = vi.fn();
  renderWithProviders(
    <PositionForm initial={initial} department={department} onDone={onDone} onCancel={vi.fn()} />,
  );
  return onDone;
}

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreatePositionMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdatePositionMutation).mockReturnValue(mutationTuple(update) as never);
  answerOptions();
});

describe('PositionForm', () => {
  it('waits for its pickers’ options before showing the form', () => {
    answerOptions(true);
    renderForm(null);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
  });

  it('offers only active grades, led by "Not set"', async () => {
    renderForm(null);
    expect(await optionsOf('Grade (optional)')).toEqual(['Not set', 'Grade 3']);
    expect(await optionsOf('Department')).toEqual(['Engineering', 'Sales']);
  });

  it('creates a position in the department it was opened from', async () => {
    const onDone = renderForm(null);
    expect(combobox('Department')).toHaveTextContent('Engineering');
    await fillField('Position name', 'Designer');
    setNumber('Minimum salary', '40000');
    setNumber('Maximum salary', '60000');
    setNumber('Approved headcount', '2');
    await chooseOption('Grade (optional)', 'Grade 3');
    await chooseOption('Employment type (optional)', 'Full time');
    await userEvent.click(screen.getByLabelText('Open for new employees'));
    await press('Create');

    expect(await screen.findByText('Position created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Designer',
          department: 'Engineering',
          code: null,
          description: null,
          minSalary: 40000,
          maxSalary: 60000,
          grade: 'G3',
          employmentType: 'FT',
          headcount: 2,
          active: false,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('refuses a band that runs downwards and a missing name', async () => {
    renderForm(null);
    setNumber('Minimum salary', '90000');
    setNumber('Maximum salary', '50000');
    await press('Create');
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Maximum salary cannot be less than the minimum')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('opens on the position and updates it by id', async () => {
    const onDone = renderForm(engineer, '');
    expect(screen.getByRole('textbox', { name: 'Position name' })).toHaveValue('Software Engineer');
    await fillField('Description (optional)', 'Ships features');
    await press('Update');

    expect(await screen.findByText('Position updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'pos-1',
        input: {
          name: 'Software Engineer',
          department: 'Engineering',
          code: 'SE2',
          description: 'Ships features',
          minSalary: 50000,
          maxSalary: 90000,
          grade: 'G3',
          employmentType: 'FULL_TIME',
          headcount: 3,
          active: true,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('opens with no options when the lists never arrived', () => {
    vi.mocked(useListDepartmentsQuery).mockReturnValue(queryResult(undefined) as never);
    vi.mocked(useListGradesQuery).mockReturnValue(queryResult(undefined) as never);
    vi.mocked(useListEmploymentTypesQuery).mockReturnValue(queryResult(undefined) as never);
    renderForm(null);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('waits while only the employment types are still loading', () => {
    vi.mocked(useListEmploymentTypesQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderForm(null);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

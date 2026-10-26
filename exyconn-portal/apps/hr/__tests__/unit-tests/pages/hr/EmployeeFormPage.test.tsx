import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { useGetUserQuery } from '@exyconn/shell/graphql/generated';
import { EmployeeFormPage } from '../../../../src/pages/hr';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../../harness/gql-doubles';
import { UrlProbe } from '../../harness/url-probe';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetUserQuery: vi.fn(),
}));

vi.mock('@exyconn/shell/pages/user-forms/user', async () => ({
  UserForm: (await import('../../harness/form-stub')).FormStub,
}));

// The salary accounts panel is tested in the shell; here only where it appears matters.
vi.mock('@exyconn/shell/pages/UserDetails', () => ({
  EmployeePayoutPanel: ({ employeeId, country }: { employeeId: string; country: string }) => (
    <p>{`Salary accounts of ${employeeId} in ${country || 'the company country'}`}</p>
  ),
}));

const employee = { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', country: 'IN' };

function renderAt(route: string) {
  renderWithProviders(
    <>
      <Routes>
        <Route path="/hr/employees/new" element={<EmployeeFormPage />} />
        <Route path="/hr/employees/:id/edit" element={<EmployeeFormPage />} />
        <Route path="*" element={null} />
      </Routes>
      <UrlProbe />
    </>,
    { route },
  );
}

const url = () => screen.getByLabelText('current url');

beforeEach(() => {
  vi.mocked(useGetUserQuery).mockReturnValue(queryResult(undefined) as never);
});

describe('EmployeeFormPage — new employee', () => {
  it('opens a blank record without asking the server for one', () => {
    renderAt('/hr/employees/new');
    expect(screen.getByRole('heading', { name: 'New employee' })).toBeInTheDocument();
    expect(
      screen.getByText('Creates the account and emails a temporary password.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    // Accounts are added once the employee exists, against their id.
    expect(screen.queryByText(/^Salary accounts of/)).toBeNull();
    expect(useGetUserQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: '' }, skip: true }),
    );
  });

  it.each([
    ['once the employee is created', 'Finish form'],
    ['from the back link', 'Back to employee records'],
    ['when the form is cancelled', 'Cancel form'],
  ])('returns to the records %s', async (_case, button) => {
    renderAt('/hr/employees/new');
    await userEvent.click(screen.getByRole('button', { name: button }));
    expect(url()).toHaveTextContent(/^\/hr\/employees$/);
  });
});

describe('EmployeeFormPage — editing', () => {
  it('waits for the record, with a spinner and no form', () => {
    vi.mocked(useGetUserQuery).mockReturnValue(queryResult(undefined, { loading: true }) as never);
    renderAt('/hr/employees/u1/edit');
    expect(screen.getByRole('heading', { name: 'Edit employee' })).toBeInTheDocument();
    expect(document.querySelector('[role="status"][aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText(/^Form for|^Blank form/)).not.toBeInTheDocument();
    expect(useGetUserQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'u1' }, skip: false }),
    );
  });

  it('fills the form with the record and opens it again once saved', async () => {
    vi.mocked(useGetUserQuery).mockReturnValue(
      queryResult({ getUser: employee }, { loading: true }) as never,
    );
    renderAt('/hr/employees/u1/edit');
    expect(
      screen.getByText(
        'Changes to the working arrangement reach the desktop tracker within a minute.',
      ),
    ).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    expect(screen.getByText(`Form for ${JSON.stringify(employee)}`)).toBeInTheDocument();
    expect(screen.getByText('Salary accounts of u1 in IN')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(url()).toHaveTextContent('/hr/employees/u1');
    expect(url()).not.toHaveTextContent('edit');
  });

  it('says why the record could not be loaded', () => {
    vi.mocked(useGetUserQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Not allowed') }) as never,
    );
    renderAt('/hr/employees/u1/edit');
    expect(screen.getByText('Not allowed')).toBeInTheDocument();
    expect(screen.queryByText(/^Form for/)).not.toBeInTheDocument();
  });

  it('falls back to a plain sentence for an error with no message', () => {
    const blank = new Error('replaced below');
    blank.message = '';
    vi.mocked(useGetUserQuery).mockReturnValue(queryResult(undefined, { error: blank }) as never);
    renderAt('/hr/employees/u1/edit');
    expect(screen.getByText('Failed to load the employee.')).toBeInTheDocument();
  });
});

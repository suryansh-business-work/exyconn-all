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

const employee = { id: 'u1', name: 'Asha Rao', email: 'asha@example.com' };

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
    expect(useGetUserQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: '' }, skip: true }),
    );
  });

  it('returns to the records once the employee is created', async () => {
    renderAt('/hr/employees/new');
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(url()).toHaveTextContent(/^\/hr\/employees$/);
  });

  it('goes back to the records from the back link', async () => {
    renderAt('/hr/employees/new');
    await userEvent.click(screen.getByRole('button', { name: 'Back to employee records' }));
    expect(url()).toHaveTextContent(/^\/hr\/employees$/);
  });

  it('cancels back to the records', async () => {
    renderAt('/hr/employees/new');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(url()).toHaveTextContent(/^\/hr\/employees$/);
  });
});

describe('EmployeeFormPage — editing', () => {
  it('waits for the record, with a spinner and no form', () => {
    vi.mocked(useGetUserQuery).mockReturnValue(queryResult(undefined, { loading: true }) as never);
    renderAt('/hr/employees/u1/edit');
    expect(screen.getByRole('heading', { name: 'Edit employee' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
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
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText(`Form for ${JSON.stringify(employee)}`)).toBeInTheDocument();

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
    vi.mocked(useGetUserQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('') }) as never,
    );
    renderAt('/hr/employees/u1/edit');
    expect(screen.getByText('Failed to load the employee.')).toBeInTheDocument();
  });
});

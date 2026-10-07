import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { DocumentKind } from '@exyconn/shell/graphql/generated';
import {
  EmployeeDocumentForm,
  type EmployeeDocumentRow,
} from '../../../../../../src/pages/documents/forms/employee-document';
import { renderWithProviders } from '../../../../test-utils';
import { USERS, localIso, pickDate, pickOption, press, typeInto } from '../../../../harness/forms';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), users: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateEmployeeDocumentMutation: () => [gql.create],
  useUpdateEmployeeDocumentMutation: () => [gql.update],
  useListUsersQuery: () => gql.users(),
}));

const row: EmployeeDocumentRow = {
  id: 'doc-4',
  employeeId: 'user-2',
  kind: DocumentKind.Tax,
  title: 'Form 16',
  url: 'https://files.example.com/form16.pdf',
  issuedOn: localIso(2026, 4, 31),
};

function renderForm(initial: EmployeeDocumentRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <EmployeeDocumentForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

describe('EmployeeDocumentForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({});
    gql.update.mockReset().mockResolvedValue({});
    gql.users.mockReset().mockReturnValue({ data: { listUsers: USERS } });
  });

  it('asks for the employee, title, file link and issue date', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('File link is required')).toBeInTheDocument();
    expect(screen.getByText('Issued on is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a file link that is not a full web address', async () => {
    renderForm();

    await typeInto('File link', 'form16.pdf');
    await press('Create');

    expect(await screen.findByText('Enter a full URL starting with https://')).toBeInTheDocument();
  });

  it('creates a document for the picked employee with the first kind preselected', async () => {
    const { onDone } = renderForm();

    await pickOption('Employee', 'Asha Rao (asha@example.com)');
    await typeInto('Title', 'Appointment letter');
    await typeInto('File link', 'https://files.example.com/appointment.pdf');
    pickDate('issuedOn', '01/05/2026');
    await press('Create');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            employeeId: 'user-1',
            kind: DocumentKind.AppointmentLetter,
            title: 'Appointment letter',
            url: 'https://files.example.com/appointment.pdf',
            issuedOn: localIso(2026, 0, 5),
          },
        },
      }),
    );
    expect(await screen.findByText('EmployeeDocument created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('updates an existing document by id with what it was opened with', async () => {
    const { onDone } = renderForm(row);

    await press('Update');

    await waitFor(() =>
      expect(gql.update).toHaveBeenCalledWith({
        variables: {
          id: 'doc-4',
          input: {
            employeeId: 'user-2',
            kind: DocumentKind.Tax,
            title: 'Form 16',
            url: 'https://files.example.com/form16.pdf',
            issuedOn: row.issuedOn,
          },
        },
      }),
    );
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('falls back to a generic message when the failure is not an Error', async () => {
    gql.update.mockRejectedValueOnce('offline');
    const { onDone } = renderForm(row);

    await press('Update');

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    gql.users.mockReturnValue({ data: undefined });
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

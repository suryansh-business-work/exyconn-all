import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import {
  EmployeeEmailKind,
  RequestEmployeeEmailCodeDocument,
  WorkWeekDocument,
} from '@/graphql/generated';
import { EmailFields } from '@/pages/user-forms/user/user.email-fields';
import { WorkDaysField } from '@/pages/user-forms/user/user.work-days-field';
import type { UserRow } from '@/pages/user-forms/user';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../../../components/form/formHarness';
import { FORM_TIMEOUT, SLOW } from '../slow';
import type { MutationOverride } from '../mutationOverride';
import { makeUserRow } from './userFixtures';

const override = vi.hoisted((): MutationOverride => ({ mutate: null }));

vi.mock('@/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/graphql/generated')>();
  const { withOverride } = await import('../mutationOverride');
  return {
    ...actual,
    useRequestEmployeeEmailCodeMutation: withOverride(
      override,
      actual.useRequestEmployeeEmailCodeMutation,
    ),
  };
});

function requestMock(kind: EmployeeEmailKind, error?: Error): MockLink.MockedResponse {
  const request = {
    query: RequestEmployeeEmailCodeDocument,
    variables: { employeeId: 'emp-1', kind },
  };
  if (error) return { request, error };
  return { request, result: { data: { requestEmployeeEmailCode: true } } };
}

function renderFields(employee: UserRow | null, mocks: MockLink.MockedResponse[] = []) {
  renderWithProviders(
    <FormHarness
      defaultValues={{
        email: employee?.email ?? '',
        personalEmail: employee?.personalEmail ?? '',
      }}
    >
      <EmailFields employee={employee} />
    </FormHarness>,
    { mocks },
  );
}

/** The row an address field sits in, with its verification beside it. */
const rowOf = (label: string) =>
  screen.getByLabelText(label).closest('.MuiFormControl-root')!.parentElement!.parentElement!;

describe('EmailFields', () => {
  it('offers no verification for an employee that does not exist yet', () => {
    renderFields(null);
    expect(screen.getByLabelText('Official email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Personal email (optional)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verify' })).not.toBeInTheDocument();
  });

  it('marks a proven address verified and offers to verify the other', () => {
    renderFields(
      makeUserRow({
        emailVerifiedAt: '2026-06-01T10:00:00.000Z',
        personalEmail: 'meera@home.test',
        personalEmailVerifiedAt: null,
      }),
    );
    expect(within(rowOf('Official email')).getByText('Verified')).toBeInTheDocument();
    expect(
      within(rowOf('Personal email (optional)')).getByRole('button', { name: 'Verify' }),
    ).toBeInTheDocument();
  });

  it('asks for a save first once the address in the field differs from the saved one', () => {
    renderFields(makeUserRow());
    expect(within(rowOf('Official email')).getByRole('button', { name: 'Verify' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('Official email'), {
      target: { value: 'meera@new.test' },
    });
    expect(within(rowOf('Official email')).getByText('Save to verify')).toBeInTheDocument();
    // Only case and spaces changed: still the saved address.
    fireEvent.change(screen.getByLabelText('Official email'), {
      target: { value: ' MEERA@acme.test ' },
    });
    expect(within(rowOf('Official email')).getByRole('button', { name: 'Verify' })).toBeVisible();
    // An email input drops surrounding spaces itself; the case change is what reaches the form.
    expect(formValues().email).toBe('MEERA@acme.test');
  });

  it('shows no verification for an empty personal address', () => {
    renderFields(makeUserRow());
    expect(within(rowOf('Personal email (optional)')).queryByRole('button')).toBeNull();
  });

  it(
    'emails a code to the saved address and opens the code form for it',
    async () => {
      renderFields(makeUserRow({ personalEmail: 'meera@home.test' }), [
        requestMock(EmployeeEmailKind.Personal),
      ]);
      await userEvent.click(
        within(rowOf('Personal email (optional)')).getByRole('button', { name: 'Verify' }),
      );
      expect(
        await screen.findByText('A code was emailed to meera@home.test', {}, SLOW),
      ).toBeInTheDocument();
      const dialog = await screen.findByRole('dialog', { name: 'Verify email address' }, SLOW);
      expect(dialog).toHaveTextContent('meera@home.test');

      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    },
    FORM_TIMEOUT,
  );

  it(
    'says why a code could not be sent and opens nothing',
    async () => {
      renderFields(makeUserRow(), [
        requestMock(EmployeeEmailKind.Official, new Error('Mail is not set up')),
      ]);
      await userEvent.click(
        within(rowOf('Official email')).getByRole('button', { name: 'Verify' }),
      );
      expect(await screen.findByText('Mail is not set up', {}, SLOW)).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );

  it(
    'falls back to a plain message for a failure that carries none',
    async () => {
      override.mutate = vi.fn().mockRejectedValue('offline');
      try {
        renderFields(makeUserRow());
        await userEvent.click(
          within(rowOf('Official email')).getByRole('button', { name: 'Verify' }),
        );
        expect(await screen.findByText('Could not send the code', {}, SLOW)).toBeInTheDocument();
        expect(override.mutate).toHaveBeenCalledWith({
          variables: { employeeId: 'emp-1', kind: EmployeeEmailKind.Official },
        });
      } finally {
        override.mutate = null;
      }
    },
    FORM_TIMEOUT,
  );
});

describe('WorkDaysField', () => {
  const renderWeek = (mocks: MockLink.MockedResponse[]) =>
    renderWithProviders(
      <FormHarness defaultValues={{ workDays: [] }}>
        <WorkDaysField />
      </FormHarness>,
      { mocks },
    );

  it("names the company's week as what an empty pick follows", async () => {
    renderWeek([
      {
        request: { query: WorkWeekDocument },
        result: { data: { workWeek: { __typename: 'WorkWeek', defaultWorkDays: [0, 6] } } },
      },
    ]);
    expect(screen.getByRole('group', { name: 'Work days' })).toBeInTheDocument();
    expect(
      await screen.findByText('Leave empty to follow the company week (Sat and Sun).', {}, SLOW),
    ).toBeInTheDocument();
  });

  it('still explains the empty pick when the company week cannot be read', () => {
    renderWeek([]);
    expect(screen.getByText('Leave empty to follow the company week.')).toBeInTheDocument();
  });
});

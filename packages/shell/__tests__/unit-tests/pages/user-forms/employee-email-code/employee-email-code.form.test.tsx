import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { EmployeeEmailKind, VerifyEmployeeEmailCodeDocument } from '@/graphql/generated';
import {
  EmployeeEmailCodeDialog,
  EmployeeEmailCodeForm,
} from '@/pages/user-forms/employee-email-code';
import { renderWithProviders } from '../../../test-utils';
import { FORM_TIMEOUT, SLOW } from '../slow';
import type { MutationOverride } from '../mutationOverride';

const override = vi.hoisted((): MutationOverride => ({ mutate: null }));

vi.mock('@/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/graphql/generated')>();
  const { withOverride } = await import('../mutationOverride');
  return {
    ...actual,
    useVerifyEmployeeEmailCodeMutation: withOverride(
      override,
      actual.useVerifyEmployeeEmailCodeMutation,
    ),
  };
});

const TARGET = {
  employeeId: 'emp-1',
  kind: EmployeeEmailKind.Personal,
  address: 'meera@home.test',
};

function verifyMock(error?: Error): MockLink.MockedResponse {
  const request = {
    query: VerifyEmployeeEmailCodeDocument,
    variables: { employeeId: 'emp-1', kind: EmployeeEmailKind.Personal, code: '123456' },
  };
  if (error) return { request, error };
  return {
    request,
    result: {
      data: {
        verifyEmployeeEmailCode: {
          __typename: 'User',
          id: 'emp-1',
          email: 'meera@example.com',
          emailVerifiedAt: null,
          personalEmail: 'meera@home.test',
          personalEmailVerifiedAt: '2026-06-15T10:00:00.000Z',
        },
      },
    },
  };
}

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<EmployeeEmailCodeForm {...TARGET} onDone={onDone} onCancel={onCancel} />, {
    mocks,
  });
  return { onDone, onCancel };
}

const codeField = () => screen.getByLabelText(/^Verification code\s*\*?$/);
const verifyButton = () => screen.getByRole('button', { name: 'Verify' });

describe('EmployeeEmailCodeForm', () => {
  it(
    'says where the code went and asks for six digits',
    async () => {
      renderForm();
      expect(screen.getByText(/A 6-digit code was emailed to meera@home.test/)).toBeInTheDocument();
      expect(codeField()).toHaveAttribute('autocomplete', 'one-time-code');
      expect(codeField()).toHaveAttribute('maxlength', '6');
      expect(codeField()).toHaveAttribute('inputmode', 'numeric');

      await userEvent.click(verifyButton());
      expect(
        await screen.findByText('Enter the code from the email', {}, SLOW),
      ).toBeInTheDocument();

      await userEvent.type(codeField(), '12ab5');
      await userEvent.tab();
      expect(await screen.findByText('The code is 6 digits', {}, SLOW)).toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );

  it(
    'verifies the address with the trimmed code and finishes',
    async () => {
      const { onDone } = renderForm([verifyMock()]);
      fireEvent.change(codeField(), { target: { value: ' 123456 ' } });
      await userEvent.click(verifyButton());

      expect(await screen.findByText('meera@home.test is verified', {}, SLOW)).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
    },
    FORM_TIMEOUT,
  );

  it(
    'says why a wrong or expired code was refused, and stays open',
    async () => {
      const { onDone } = renderForm([verifyMock(new Error('That code has expired'))]);
      fireEvent.change(codeField(), { target: { value: '123456' } });
      await userEvent.click(verifyButton());

      expect(await screen.findByText('That code has expired', {}, SLOW)).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );

  it(
    'falls back to a plain message for a failure that carries none',
    async () => {
      override.mutate = vi.fn().mockRejectedValue('offline');
      try {
        const { onDone } = renderForm();
        fireEvent.change(codeField(), { target: { value: '654321' } });
        await userEvent.click(verifyButton());

        expect(await screen.findByText('Could not verify the code', {}, SLOW)).toBeInTheDocument();
        expect(override.mutate).toHaveBeenCalledWith({
          variables: { employeeId: 'emp-1', kind: EmployeeEmailKind.Personal, code: '654321' },
        });
        expect(onDone).not.toHaveBeenCalled();
      } finally {
        override.mutate = null;
      }
    },
    FORM_TIMEOUT,
  );

  it(
    'cancels without verifying',
    async () => {
      const { onCancel, onDone } = renderForm();
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
      expect(onDone).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );
});

describe('EmployeeEmailCodeDialog', () => {
  it('stays closed with no address to prove', () => {
    renderWithProviders(<EmployeeEmailCodeDialog target={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it(
    'holds the code form and keeps its submit from reaching a form around it',
    async () => {
      const outer = vi.fn((event: Event) => event.preventDefault());
      const onClose = vi.fn();
      renderWithProviders(
        <form onSubmit={(event) => outer(event.nativeEvent)}>
          <EmployeeEmailCodeDialog target={TARGET} onClose={onClose} />
        </form>,
      );
      expect(screen.getByRole('dialog', { name: 'Verify email address' })).toBeInTheDocument();
      await userEvent.click(verifyButton());
      expect(
        await screen.findByText('Enter the code from the email', {}, SLOW),
      ).toBeInTheDocument();
      expect(outer).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    },
    FORM_TIMEOUT,
  );
});

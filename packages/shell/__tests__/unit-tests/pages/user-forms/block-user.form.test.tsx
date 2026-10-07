import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { SetUserBlockedDocument } from '@/graphql/generated';
import { BlockUserForm } from '@/pages/user-forms/block-user';
import { renderWithProviders } from '../../test-utils';
import { FORM_TIMEOUT, SLOW } from './slow';
import type { MutationOverride } from './mutationOverride';

const override = vi.hoisted((): MutationOverride => ({ mutate: null }));

vi.mock('@/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/graphql/generated')>();
  const { withOverride } = await import('./mutationOverride');
  return {
    ...actual,
    useSetUserBlockedMutation: withOverride(override, actual.useSetUserBlockedMutation),
  };
});

const REASON = 'Repeated policy breach';

function blockedMock(error?: Error): MockLink.MockedResponse {
  const request = {
    query: SetUserBlockedDocument,
    variables: { id: 'user-9', isBlocked: true, reason: REASON },
  };
  if (error) return { request, error };
  return {
    request,
    result: {
      data: {
        setUserBlocked: { __typename: 'User', id: 'user-9', isBlocked: true, blockReason: REASON },
      },
    },
  };
}

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<BlockUserForm userId="user-9" onDone={onDone} onCancel={onCancel} />, {
    mocks,
  });
  return { onDone, onCancel };
}

const reasonField = () => screen.getByLabelText('Reason for blocking');

describe('BlockUserForm', () => {
  it(
    'requires a reason of at least three characters',
    async () => {
      renderForm();

      await userEvent.click(screen.getByRole('button', { name: 'Block' }));
      expect(await screen.findByText('A reason is required', {}, SLOW)).toBeInTheDocument();

      await userEvent.type(reasonField(), ' ab ');
      await userEvent.tab();
      expect(await screen.findByText('Minimum 3 characters', {}, SLOW)).toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );

  it(
    'blocks the user with the reason, confirms and finishes',
    async () => {
      const { onDone } = renderForm([blockedMock()]);
      expect(
        screen.getByText(
          'Shown internally; the user only sees a generic blocked message at sign-in.',
        ),
      ).toBeInTheDocument();

      fireEvent.change(reasonField(), { target: { value: REASON } });
      await userEvent.click(screen.getByRole('button', { name: 'Block' }));

      expect(await screen.findByText('User blocked', {}, SLOW)).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
    },
    FORM_TIMEOUT,
  );

  it(
    "shows the server's error and stays open when blocking fails",
    async () => {
      const { onDone } = renderForm([blockedMock(new Error('User not found'))]);

      fireEvent.change(reasonField(), { target: { value: REASON } });
      await userEvent.click(screen.getByRole('button', { name: 'Block' }));

      expect(await screen.findByText('User not found', {}, SLOW)).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );

  it(
    'falls back to a generic message for a failure that carries none',
    async () => {
      override.mutate = vi.fn().mockRejectedValue('offline');
      try {
        const { onDone } = renderForm();

        fireEvent.change(reasonField(), { target: { value: REASON } });
        await userEvent.click(screen.getByRole('button', { name: 'Block' }));

        expect(await screen.findByText('Failed to block user', {}, SLOW)).toBeInTheDocument();
        expect(override.mutate).toHaveBeenCalledWith({
          variables: { id: 'user-9', isBlocked: true, reason: REASON },
        });
        expect(onDone).not.toHaveBeenCalled();
      } finally {
        override.mutate = null;
      }
    },
    FORM_TIMEOUT,
  );

  it(
    'cancels without blocking',
    async () => {
      const { onCancel, onDone } = renderForm();

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
      expect(onDone).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );
});

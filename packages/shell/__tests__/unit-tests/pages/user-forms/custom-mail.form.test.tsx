import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { SendUserMailDocument } from '@/graphql/generated';
import { CustomMailForm } from '@/pages/user-forms/custom-mail';
import { renderWithProviders } from '../../test-utils';
import { FORM_TIMEOUT, SLOW } from './slow';
import type { MutationOverride } from './mutationOverride';

const override = vi.hoisted((): MutationOverride => ({ mutate: null }));

vi.mock('@/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/graphql/generated')>();
  const { withOverride } = await import('./mutationOverride');
  return {
    ...actual,
    useSendUserMailMutation: withOverride(override, actual.useSendUserMailMutation),
  };
});

const SUBJECT = 'Laptop return';
const MESSAGE = 'Please return the laptop by Friday.';

function mailMock(error?: Error): MockLink.MockedResponse {
  const request = {
    query: SendUserMailDocument,
    variables: { id: 'user-3', input: { subject: SUBJECT, message: MESSAGE } },
  };
  return error ? { request, error } : { request, result: { data: { sendUserMail: true } } };
}

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<CustomMailForm userId="user-3" onDone={onDone} onCancel={onCancel} />, {
    mocks,
  });
  return { onDone, onCancel };
}

async function fillAndSend(subject = SUBJECT, message = MESSAGE) {
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: subject } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: message } });
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));
}

describe('CustomMailForm', () => {
  it(
    'requires a subject and a message',
    async () => {
      renderForm();

      await userEvent.click(screen.getByRole('button', { name: 'Send' }));

      expect(await screen.findByText('Subject is required', {}, SLOW)).toBeInTheDocument();
      expect(screen.getByText('Message is required')).toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );

  it(
    'rejects a subject under 3 and a message under 10 characters',
    async () => {
      const { onDone } = renderForm();

      await fillAndSend('Hi', 'Too short');

      expect(await screen.findByText('Minimum 3 characters', {}, SLOW)).toBeInTheDocument();
      expect(screen.getByText('Minimum 10 characters')).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );

  it(
    'sends the mail, confirms and finishes',
    async () => {
      const { onDone } = renderForm([mailMock()]);

      await fillAndSend(`  ${SUBJECT} `);

      expect(await screen.findByText('Email sent', {}, SLOW)).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
    },
    FORM_TIMEOUT,
  );

  it(
    "shows the server's error when sending fails",
    async () => {
      const { onDone } = renderForm([mailMock(new Error('SMTP is not configured'))]);

      await fillAndSend();

      expect(await screen.findByText('SMTP is not configured', {}, SLOW)).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );

  it(
    'falls back to a generic message for a failure that carries none',
    async () => {
      override.mutate = vi.fn().mockRejectedValue(undefined);
      try {
        const { onDone } = renderForm();

        await fillAndSend();

        expect(await screen.findByText('Failed to send email', {}, SLOW)).toBeInTheDocument();
        expect(onDone).not.toHaveBeenCalled();
      } finally {
        override.mutate = null;
      }
    },
    FORM_TIMEOUT,
  );

  it(
    'cancels from the Cancel button',
    async () => {
      const { onCancel } = renderForm();

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    },
    FORM_TIMEOUT,
  );
});

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

/** The editor itself is tested in @exyconn/rich-text; here it is a textarea holding HTML. */
vi.mock('@exyconn/rich-text', () => ({
  RichTextEditor: (
    props: Readonly<{
      label: string;
      value: string;
      error?: string;
      onChange: (html: string) => void;
      onBlur?: () => void;
    }>,
  ) => (
    <label>
      {props.label}
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onBlur={props.onBlur}
      />
      {props.error && <span>{props.error}</span>}
    </label>
  ),
}));

const SUBJECT = 'Laptop return';
const MESSAGE = '<p>Please return the laptop by Friday.</p>';
const RECIPIENT = { name: 'Meera Nair', email: 'meera@example.com' };

function mailMock(input: Record<string, unknown> = {}, error?: Error): MockLink.MockedResponse {
  const request = {
    query: SendUserMailDocument,
    variables: {
      id: 'user-3',
      input: { cc: [], bcc: [], subject: SUBJECT, message: MESSAGE, attachments: [], ...input },
    },
  };
  return error ? { request, error } : { request, result: { data: { sendUserMail: true } } };
}

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <CustomMailForm userId="user-3" recipient={RECIPIENT} onDone={onDone} onCancel={onCancel} />,
    { mocks },
  );
  return { onDone, onCancel };
}

const messageBox = () => screen.getByRole('textbox', { name: /^Message/ });

async function fillAndSend(subject = SUBJECT, message = MESSAGE) {
  fireEvent.change(screen.getByRole('textbox', { name: /^Subject/ }), {
    target: { value: subject },
  });
  fireEvent.change(messageBox(), { target: { value: message } });
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));
}

/** Types each address into a chips field and presses Enter after it. */
async function typeAddresses(label: string, addresses: string[]) {
  const field = screen.getByRole('combobox', { name: label });
  for (const address of addresses) {
    await userEvent.type(field, `${address}{Enter}`);
  }
}

describe('CustomMailForm', () => {
  it('addresses the person on the To line, with Cc and Bcc out of the way', () => {
    renderForm();

    expect(screen.getByText('Meera Nair <meera@example.com>')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Cc' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Bcc' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach file' })).toBeInTheDocument();
  });

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
    'rejects a subject under 3 and a message under 10 characters, reading past empty tags',
    async () => {
      const { onDone } = renderForm();

      await fillAndSend('Hi', '<p>Too short</p>');

      expect(await screen.findByText('Minimum 3 characters', {}, SLOW)).toBeInTheDocument();
      expect(screen.getByText('Minimum 10 characters')).toBeInTheDocument();
      fireEvent.change(messageBox(), { target: { value: '<p> </p>' } });
      expect(await screen.findByText('Message is required', {}, SLOW)).toBeInTheDocument();
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
    'copies people in on Cc and Bcc once they are opened',
    async () => {
      const { onDone } = renderForm([
        mailMock({ cc: ['lead@example.com'], bcc: ['hr@example.com'] }),
      ]);

      await userEvent.click(screen.getByRole('button', { name: 'Cc' }));
      await userEvent.click(screen.getByRole('button', { name: 'Bcc' }));
      await typeAddresses('Cc', ['lead@example.com']);
      await typeAddresses('Bcc', ['hr@example.com']);
      await fillAndSend();

      expect(await screen.findByText('Email sent', {}, SLOW)).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
    },
    FORM_TIMEOUT,
  );

  it(
    'refuses a copied address that is not an email',
    async () => {
      const { onDone } = renderForm();

      await userEvent.click(screen.getByRole('button', { name: 'Cc' }));
      await typeAddresses('Cc', ['not-an-address']);
      await fillAndSend();

      expect(
        await screen.findByText('Every address must be a valid email', {}, SLOW),
      ).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );

  it(
    "shows the server's error when sending fails",
    async () => {
      const { onDone } = renderForm([mailMock({}, new Error('SMTP is not configured'))]);

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

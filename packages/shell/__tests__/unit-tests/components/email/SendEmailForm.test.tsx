import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { CrmEmailProvider, useSendMyEmailMutation } from '@/graphql/generated';
import { closeDockPanel, writeMemory } from '@/components/compose-dock';
import { SendEmailForm, type EmailDraft } from '@/components/email';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple } from '../../pages/hookMocks';
import { FORM_TIMEOUT, SLOW } from '../../pages/user-forms/slow';
import { myMailbox } from './mailboxFixtures';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useSendMyEmailMutation: vi.fn(),
}));

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

const send = vi.fn();
const MAILBOXES = [
  myMailbox(),
  myMailbox({ id: 'm2', email: 'me@outlook.com', provider: CrmEmailProvider.Microsoft }),
];
const BODY = '<p>Thanks for the call.</p>';

function renderForm(draft: EmailDraft, mailboxes = MAILBOXES, memoryKey?: string) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <SendEmailForm
            draft={draft}
            mailboxes={mailboxes}
            memoryKey={memoryKey}
            onDone={onDone}
            onCancel={onCancel}
          />
        }
      />
      <Route path="/settings" element={<h1>Settings</h1>} />
    </Routes>,
  );
  return { onDone, onCancel };
}

const fill = (subject: string, body: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: /^Subject/ }), {
    target: { value: subject },
  });
  fireEvent.change(screen.getByRole('textbox', { name: /^Message/ }), { target: { value: body } });
};

describe('SendEmailForm', () => {
  beforeEach(() => {
    vi.mocked(useSendMyEmailMutation).mockReturnValue(
      mutationTuple(send) as unknown as ReturnType<typeof useSendMyEmailMutation>,
    );
  });

  afterEach(() => {
    send.mockReset();
    closeDockPanel('email:ada@acme.io');
  });

  it(
    'sends from the default mailbox to the draft recipients and closes',
    async () => {
      send.mockResolvedValue({ data: { sendMyEmail: { recipientCount: 2 } } });
      const { onDone } = renderForm({
        to: ['ada@acme.io'],
        cc: ['b@acme.io'],
        bcc: [],
        subject: 'Hello',
        body: BODY,
      });

      expect(screen.getByText('ada@acme.io')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Send' }));

      await vi.waitFor(() => expect(onDone).toHaveBeenCalled(), SLOW);
      expect(send).toHaveBeenCalledWith({
        variables: {
          input: {
            fromMailboxId: 'm1',
            to: ['ada@acme.io'],
            cc: ['b@acme.io'],
            bcc: [],
            subject: 'Hello',
            body: BODY,
          },
        },
      });
      expect(await screen.findByText('Email sent')).toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );

  it(
    'says why when the mailbox refuses, and stays open',
    async () => {
      send.mockRejectedValue(new Error('Reconnect me@acme.io in Settings > Mailboxes.'));
      const { onDone } = renderForm({ to: ['ada@acme.io'] });
      fill('Hello', BODY);

      await userEvent.click(screen.getByRole('button', { name: 'Send' }));

      expect(
        await screen.findByText('Reconnect me@acme.io in Settings > Mailboxes.', {}, SLOW),
      ).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );

  it(
    'needs a mailbox, a subject and a message before it sends',
    async () => {
      renderForm({ to: ['ada@acme.io'] }, []);

      await userEvent.click(screen.getByRole('button', { name: 'Send' }));

      expect(
        await screen.findByText('Choose the mailbox to send from', {}, SLOW),
      ).toBeInTheDocument();
      expect(screen.getByText('Write a subject')).toBeInTheDocument();
      expect(screen.getByText('Write the message')).toBeInTheDocument();
      expect(send).not.toHaveBeenCalled();
    },
    FORM_TIMEOUT,
  );

  it('goes to Settings to add another mailbox', async () => {
    renderForm({ to: [] });

    await userEvent.click(screen.getByRole('combobox', { name: /^From/ }));
    expect(screen.getByRole('option', { name: 'me@outlook.com (Microsoft)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Add email' }));

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('starts from the draft kept for its window', () => {
    writeMemory('email:ada@acme.io', 'email-draft', {
      fromMailboxId: 'm2',
      to: ['ada@acme.io'],
      cc: [],
      bcc: [],
      subject: 'Kept subject',
      body: BODY,
    });

    renderForm({ to: ['ada@acme.io'] }, MAILBOXES, 'email:ada@acme.io');

    expect(screen.getByRole('textbox', { name: /^Subject/ })).toHaveValue('Kept subject');
  });
});

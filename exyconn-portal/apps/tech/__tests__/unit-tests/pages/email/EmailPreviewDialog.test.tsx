import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailPreviewDialog } from '../../../../src/pages/email/EmailPreviewDialog';
import type { PagedTemplateRow } from '../../../../src/pages/email/email-grids';
import { renderWithProviders } from '../../test-utils';
import { notify, resetHarness } from '../environment-variables/panel.harness';

const gql = vi.hoisted(() => {
  const previewState: { data?: unknown; loading?: boolean; error?: Error } = {};
  return {
    preview: vi.fn(),
    send: vi.fn(),
    previewState,
    sendState: { loading: false },
  };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePreviewEmailTemplateLazyQuery: () => [gql.preview, gql.previewState],
  useSendTestEmailTemplateMutation: () => [gql.send, gql.sendState],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('../environment-variables/panel.harness')).notifyModule(importOriginal),
);

const template = (overrides: Partial<PagedTemplateRow> = {}): PagedTemplateRow => ({
  id: 'tpl-1',
  key: 'welcome',
  name: 'Welcome',
  description: '',
  subject: 'Hello {{name}}',
  mjml: '<mjml></mjml>',
  isActive: true,
  updatedBy: 'admin',
  updatedAt: '2026-09-01T00:00:00.000Z',
  variables: ['name', 'company'],
  fragments: ['footer', 'header'],
  ...overrides,
});

const onClose = vi.fn();
const RECIPIENT = 'qa@example.test';

describe('EmailPreviewDialog', () => {
  beforeEach(() => {
    resetHarness();
    onClose.mockReset();
    gql.preview.mockReset();
    gql.preview.mockResolvedValue({});
    gql.send.mockReset();
    gql.previewState = {};
    gql.sendState = { loading: false };
  });

  it('renders nothing until a template is chosen', () => {
    renderWithProviders(<EmailPreviewDialog template={null} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the template and asks for each placeholder, filled with its own name', () => {
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('welcome · uses footer, header')).toBeInTheDocument();
    expect(screen.getByLabelText('name')).toHaveValue('{name}');
    expect(screen.getByLabelText('company')).toHaveValue('{company}');
  });

  it('says when a template has no placeholders or fragments', () => {
    renderWithProviders(
      <EmailPreviewDialog
        template={template({ variables: [], fragments: [] })}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('This template has no placeholders.')).toBeInTheDocument();
    expect(screen.getByText('welcome')).toBeInTheDocument();
  });

  it('renders the preview through the real send path with the values typed', async () => {
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    await userEvent.clear(screen.getByLabelText('name'));
    await userEvent.type(screen.getByLabelText('name'), 'Ada');
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(gql.preview).toHaveBeenCalledWith({
      variables: {
        key: 'welcome',
        variables: [
          { name: 'name', value: 'Ada' },
          { name: 'company', value: '{company}' },
        ],
      },
    });
  });

  it('keeps the dialog usable when the preview request rejects', async () => {
    gql.preview.mockRejectedValue(new Error('render failed'));
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
  });

  it('locks the preview button while it renders', () => {
    gql.previewState = { loading: true };
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    expect(screen.getByRole('button', { name: 'Rendering…' })).toBeDisabled();
  });

  it('shows why the template would not render', () => {
    gql.previewState = { error: new Error('Unknown fragment "footer"') };
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    expect(screen.getByText('Unknown fragment "footer"')).toBeInTheDocument();
  });

  it('shows the rendered subject and the email in an isolated frame', () => {
    gql.previewState = {
      data: {
        previewEmailTemplate: {
          subject: 'Hello Ada',
          html: '<p>Hi Ada</p>',
          variables: ['name'],
          fragments: [],
        },
      },
    };
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    expect(screen.getByText('Hello Ada')).toBeInTheDocument();
    expect(screen.getByTitle('Email preview')).toHaveAttribute('srcdoc', '<p>Hi Ada</p>');
  });

  it('sends a test only once there is somewhere to send it', async () => {
    gql.send.mockResolvedValue({ data: {} });
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    const send = screen.getByRole('button', { name: 'Send test' });
    expect(send).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Send a test to'), '   ');
    expect(send).toBeDisabled();
    await userEvent.clear(screen.getByLabelText('Send a test to'));
    await userEvent.type(screen.getByLabelText('Send a test to'), RECIPIENT);
    await userEvent.click(send);
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Test sent to {to}', 'success', { to: RECIPIENT }),
    );
    expect(gql.send).toHaveBeenCalledWith({
      variables: {
        key: 'welcome',
        to: RECIPIENT,
        variables: [
          { name: 'name', value: '{name}' },
          { name: 'company', value: '{company}' },
        ],
      },
    });
  });

  it.each([
    [new Error('SMTP refused the recipient'), 'SMTP refused the recipient'],
    ['offline', 'The test email could not be sent'],
  ])('says why a test send failed (%s)', async (failure, message) => {
    gql.send.mockRejectedValue(failure);
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    await userEvent.type(screen.getByLabelText('Send a test to'), RECIPIENT);
    await userEvent.click(screen.getByRole('button', { name: 'Send test' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(message, 'error'));
  });

  it('locks the send button while a test is going out', async () => {
    gql.sendState = { loading: true };
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    await userEvent.type(screen.getByLabelText('Send a test to'), RECIPIENT);
    expect(screen.getByRole('button', { name: 'Send test' })).toBeDisabled();
  });

  it('asks the fields of the next template when it opens on another one', () => {
    const { rerender } = renderWithProviders(
      <EmailPreviewDialog template={template()} onClose={onClose} />,
    );
    rerender(
      <EmailPreviewDialog
        template={template({ id: 'tpl-2', key: 'invoice', variables: ['amount'] })}
        onClose={onClose}
      />,
    );
    expect(screen.getByLabelText('amount')).toHaveValue('{amount}');
    expect(screen.queryByLabelText('company')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    renderWithProviders(<EmailPreviewDialog template={template()} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

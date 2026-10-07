import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerNoticeForm } from '../../../../../../src/pages/tracker/forms/tracker-notice';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendTrackerNoticeMutation: () => [gql.send],
}));

const EMPLOYEES = [
  { value: 'u1', label: 'Asha Rao' },
  { value: 'u2', label: 'Dev Mehta' },
];
const EVERYONE = 'every employee with tracker access';

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const toast = () => screen.findByRole('alert', { hidden: true });

/** Fills a valid notice, submits it and answers the confirmation; returns the dialog's text. */
async function submitAndAnswer(answer: 'Send' | 'Cancel') {
  fill('Title', 'Office closed');
  fill('Message', 'Friday is a holiday.');
  await press('Send notice');
  const dialog = await screen.findByRole('dialog');
  const text = dialog.textContent ?? '';
  await userEvent.click(within(dialog).getByRole('button', { name: answer }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  return text;
}

describe('TrackerNoticeForm', () => {
  beforeEach(() => {
    gql.send.mockReset().mockResolvedValue({ data: { sendTrackerNotice: 12 } });
  });

  it('says in words that an empty recipient list reaches everybody', () => {
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    expect(
      screen.getByText(/Leave the recipients empty to reach every employee with tracker access\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Leave empty to send to everyone with tracker access.'),
    ).toBeInTheDocument();
  });

  it('refuses a notice with no title or nothing to say', async () => {
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    fill('Title', '   ');
    await press('Send notice');
    expect(await screen.findByText('A notice needs a title')).toBeInTheDocument();
    expect(screen.getByText('A notice needs something to say')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('refuses a title or message longer than the portal accepts', async () => {
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    fill('Title', 'x'.repeat(121));
    fill('Message', 'y'.repeat(2001));
    await press('Send notice');
    expect(await screen.findByText('Keep the title under 120 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the message under 2000 characters')).toBeInTheDocument();
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('asks first, then sends to everybody, says how many it reached and clears the form', async () => {
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    const text = await submitAndAnswer('Send');
    expect(text).toContain('Send this notice?');
    expect(text).toContain(
      `It appears immediately as a desktop notification for ${EVERYONE}. It cannot be recalled.`,
    );
    expect(gql.send).toHaveBeenCalledWith({
      variables: { input: { title: 'Office closed', body: 'Friday is a holiday.', userIds: [] } },
    });
    expect(await toast()).toHaveTextContent('Notice sent to 12 employee(s)');
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue(''));
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('narrows the notice to the employees picked, and says how many', async () => {
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    await userEvent.click(screen.getByRole('combobox', { name: /Recipients \(optional\)/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Dev Mehta' }),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(
      screen.getByText(/Leave the recipients empty to reach 1 employee\(s\)\./),
    ).toBeInTheDocument();

    const text = await submitAndAnswer('Send');
    expect(text).toContain('for 1 employee(s).');
    expect(gql.send).toHaveBeenCalledWith({
      variables: {
        input: { title: 'Office closed', body: 'Friday is a holiday.', userIds: ['u2'] },
      },
    });
  });

  it('sends nothing and keeps the draft when the confirmation is cancelled', async () => {
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    await submitAndAnswer('Cancel');
    expect(gql.send).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Title')).toHaveValue('Office closed');
  });

  it('reports zero recipients when the server answers without a count', async () => {
    gql.send.mockResolvedValue({ data: null });
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    await submitAndAnswer('Send');
    expect(await toast()).toHaveTextContent('Notice sent to 0 employee(s)');
  });

  it('says why a notice could not be sent and keeps the draft', async () => {
    gql.send.mockRejectedValue(new Error('No employee has tracker access'));
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    await submitAndAnswer('Send');
    expect(await toast()).toHaveTextContent('No employee has tracker access');
    expect(screen.getByLabelText('Title')).toHaveValue('Office closed');
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.send.mockRejectedValue('offline');
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    await submitAndAnswer('Send');
    expect(await toast()).toHaveTextContent('Could not send the notice');
  });

  it('clears a half-written notice on Cancel', async () => {
    renderWithProviders(<TrackerNoticeForm employees={EMPLOYEES} />);
    fill('Title', 'Draft');
    await press('Cancel');
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue(''));
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NotificationAudience,
  NotificationKind,
  useListUsersQuery,
  useSendNotificationMutation,
} from '@exyconn/shell/graphql/generated';
import { SendNotificationForm } from '../../../../../src/pages/notify/forms/send-notification';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../../../harness/gql-doubles';
import { chooseOption, combobox, fillField, optionsOf, press } from '../../../harness/form-fields';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendNotificationMutation: vi.fn(),
  useListUsersQuery: vi.fn(),
}));

const send = vi.fn();
const SEND = 'Send notification';

const everyone = {
  kind: NotificationKind.General,
  body: null,
  link: null,
  audience: NotificationAudience.All,
  department: null,
  employeeIds: null,
};

function renderForm() {
  const onSent = vi.fn();
  renderWithProviders(<SendNotificationForm onSent={onSent} />);
  return onSent;
}

const sentInput = () => send.mock.calls[0][0].variables.input;

beforeEach(() => {
  send.mockReset().mockResolvedValue({ data: { sendNotification: { recipients: 12 } } });
  vi.mocked(useSendNotificationMutation).mockReturnValue(mutationTuple(send) as never);
  vi.mocked(useListUsersQuery).mockReturnValue(
    queryResult({
      listUsers: [
        { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', department: 'Sales' },
        { id: 'u2', name: 'Bilal Khan', email: 'bilal@example.com', department: 'Engineering' },
        { id: 'u3', name: 'Chen Li', email: 'chen@example.com', department: 'Sales' },
        { id: 'u4', name: 'Dev Rai', email: 'dev@example.com', department: null },
      ],
    }) as never,
  );
});

describe('SendNotificationForm — everyone', () => {
  it('sends a general notice to everybody, then clears itself', async () => {
    const onSent = renderForm();
    await fillField('Title', ' Payroll closes Friday ');
    await press(SEND);

    expect(await screen.findByText('Sent to 12 people.')).toBeInTheDocument();
    expect(send).toHaveBeenCalledWith({
      variables: { input: { ...everyone, title: 'Payroll closes Friday' } },
    });
    expect(onSent).toHaveBeenCalledWith(12);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue(''));
  });

  it('carries a kind, a message and an in-portal link, and says when one person got it', async () => {
    send.mockResolvedValueOnce({ data: { sendNotification: { recipients: 1 } } });
    const onSent = renderForm();
    await chooseOption('Type', 'Payroll');
    await fillField('Title', 'Payslips are out');
    await fillField('Message (optional)', 'Check your inbox');
    await fillField('Opens (optional path, e.g. /me/announcements)', '/me/payslips');
    await press(SEND);

    expect(await screen.findByText('Sent to 1 person.')).toBeInTheDocument();
    expect(sentInput()).toMatchObject({
      kind: NotificationKind.Payroll,
      body: 'Check your inbox',
      link: '/me/payslips',
    });
    expect(onSent).toHaveBeenCalledWith(1);
  });

  it('counts nobody when the server answers without a result', async () => {
    send.mockResolvedValueOnce({ data: null });
    const onSent = renderForm();
    await fillField('Title', 'Hello');
    await press(SEND);
    expect(await screen.findByText('Sent to 0 people.')).toBeInTheDocument();
    expect(onSent).toHaveBeenCalledWith(0);
  });

  it('needs a short title and refuses a link that leaves the portal', async () => {
    renderForm();
    await fillField('Opens (optional path, e.g. /me/announcements)', 'https://example.com');
    await press(SEND);
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(
      screen.getByText('Link must be an in-portal path like /me/announcements'),
    ).toBeInTheDocument();

    await fillField('Title', 'x'.repeat(121));
    expect(await screen.findByText('Keep it under 120 characters')).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('SendNotificationForm — narrowed audiences', () => {
  it('sends to one department, picked from the sorted departments people belong to', async () => {
    renderForm();
    expect(screen.queryByRole('combobox', { name: /^Department/ })).not.toBeInTheDocument();
    await fillField('Title', 'Team lunch');
    await chooseOption('Send to', 'Department');
    expect(await optionsOf('Department')).toEqual(['Engineering', 'Sales']);
    await press(SEND);
    expect(await screen.findByText('Pick a department')).toBeInTheDocument();

    await chooseOption('Department', 'Sales');
    await press(SEND);
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(sentInput()).toMatchObject({
      audience: NotificationAudience.Department,
      department: 'Sales',
      employeeIds: null,
    });
  });

  it('sends to chosen people, at least one of them', async () => {
    renderForm();
    await fillField('Title', 'Your review is due');
    await chooseOption('Send to', 'Employees');
    await press(SEND);
    expect(await screen.findByText('Pick at least one employee')).toBeInTheDocument();

    await userEvent.click(combobox('Employees'));
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(
      within(listbox).getByRole('option', { name: 'Bilal Khan (bilal@example.com)' }),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await press(SEND);

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(sentInput()).toMatchObject({
      audience: NotificationAudience.Employees,
      department: null,
      employeeIds: ['u2'],
    });
  });

  it('offers no departments before the people list arrives', async () => {
    vi.mocked(useListUsersQuery).mockReturnValue(queryResult(undefined) as never);
    renderForm();
    await chooseOption('Send to', 'Department');
    expect(await optionsOf('Department')).toEqual([]);
  });
});

describe('SendNotificationForm — sending', () => {
  it('says why a send failed and keeps what was typed', async () => {
    send.mockRejectedValueOnce(new Error('Too many notifications today'));
    const onSent = renderForm();
    await fillField('Title', 'Reminder');
    await press(SEND);
    expect(await screen.findByText('Too many notifications today')).toBeInTheDocument();
    expect(onSent).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Reminder');
  });

  it('falls back to a plain sentence when the failure carries no message', async () => {
    send.mockRejectedValueOnce('offline');
    renderForm();
    await fillField('Title', 'Reminder');
    await press(SEND);
    expect(await screen.findByText('Could not send')).toBeInTheDocument();
  });

  it('shows the send in progress', () => {
    vi.mocked(useSendNotificationMutation).mockReturnValue(mutationTuple(send, true) as never);
    renderForm();
    expect(screen.getByText('Sending…')).toBeInTheDocument();
    expect(screen.queryByText(SEND)).not.toBeInTheDocument();
  });
});

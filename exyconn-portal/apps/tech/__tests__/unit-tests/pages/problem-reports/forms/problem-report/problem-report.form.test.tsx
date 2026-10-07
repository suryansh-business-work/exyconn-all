import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ProblemReportForm,
  type ProblemReportRow,
} from '../../../../../../src/pages/problem-reports/forms/problem-report';
import { renderWithProviders } from '../../../../test-utils';
import { reportRow } from '../../report.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), monitors: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateProblemReportMutation: () => [gql.create],
  useUpdateProblemReportMutation: () => [gql.update],
  useListStatusMonitorsQuery: gql.monitors,
}));

const MONITORS = [
  { id: 'm-1', key: 'portal', name: 'Portal' },
  { id: 'm-2', key: 'api', name: 'API' },
];

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ProblemReportRow | null = null) =>
  renderWithProviders(<ProblemReportForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));

async function pick(name: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

describe('ProblemReportForm', () => {
  beforeEach(() => {
    onDone.mockReset();
    onCancel.mockReset();
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.monitors.mockReset().mockReturnValue({ data: { listStatusMonitors: MONITORS } });
  });

  it('asks for a title, a description and the reporter before logging a report', async () => {
    renderForm();
    await press('Create');

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Describe the problem — at least 20 characters')).toBeInTheDocument();
    expect(screen.getByText('Reporter name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers the whole platform and every monitored service', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('combobox', { name: /^Service/ }));

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Whole platform',
      'Portal',
      'API',
    ]);
  });

  it('logs a phoned-in report against the service picked, named from its monitor', async () => {
    renderForm();
    expect(screen.queryByText(/^PR-/)).not.toBeInTheDocument();
    await pick(/^Service/, 'API');
    fill('Title', 'API returns 502');
    fill('What happened?', 'Every request to the API has failed since 09:00 today.');
    fill('Reported by', 'Ravi Kumar');
    fill('Reporter email', 'ravi@example.test');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          serviceKey: 'api',
          serviceName: 'API',
          category: 'OUTAGE',
          severity: 'MEDIUM',
          status: 'NEW',
          subject: 'API returns 502',
          description: 'Every request to the API has failed since 09:00 today.',
          reporterName: 'Ravi Kumar',
          reporterEmail: 'ravi@example.test',
          pageUrl: '',
          assignee: '',
          resolutionNotes: '',
        },
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Problem report created');
  });

  it('rejects a malformed reporter email', async () => {
    renderForm();
    fill('Reporter email', 'not-an-email');
    await press('Create');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
  });

  it('keeps the reporter’s words in view and wants notes before resolving', async () => {
    renderForm(reportRow());
    expect(screen.getByText('PR-1042 · Portal is slow to load')).toBeInTheDocument();
    await pick(/^Status/, 'Resolved');
    await press('Update');

    expect(
      await screen.findByText('Say what was done before resolving or closing'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();

    fill('Resolution notes', 'Cleared the CDN cache');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'pr-1',
        input: expect.objectContaining({
          status: 'RESOLVED',
          resolutionNotes: 'Cleared the CDN cache',
          serviceKey: 'portal',
          serviceName: 'Portal',
        }),
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Problem report updated');
  });

  it('sends no service name while the monitors have not loaded', async () => {
    gql.monitors.mockReturnValue({ data: undefined });
    renderForm(reportRow());
    await press('Update');

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input.serviceName).toBe('');
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});

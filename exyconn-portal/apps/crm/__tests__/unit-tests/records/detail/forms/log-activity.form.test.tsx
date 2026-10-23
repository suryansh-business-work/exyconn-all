import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ActivitySubject,
  ActivityType,
  CrmTimelineDocument,
} from '@exyconn/shell/graphql/generated';
import { DetailActions } from '../../../../../src/records/detail';
import {
  logActivityDefaults,
  logActivitySchema,
  type LogActivityTarget,
} from '../../../../../src/records/detail/forms/log-activity';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), options: undefined as unknown, user: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateActivityMutation: (options: unknown) => {
    gql.options = options;
    return [gql.create];
  },
}));
vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => ({ user: gql.user() }) }));
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  DatePicker: (await import('../../date-picker-stub')).DatePickerStub,
}));

const CONTACT: LogActivityTarget = {
  relatedType: 'CONTACT',
  relatedId: 'contact-1',
  relatedName: 'Asha Rao',
};

function renderActions(target = CONTACT) {
  renderWithProviders(<DetailActions target={target} />);
}

async function openLog(action: string) {
  await userEvent.click(screen.getByRole('button', { name: action }));
  return screen.findByRole('dialog');
}

describe('logActivitySchema', () => {
  it('needs a subject, sane minutes and a due date for a task', () => {
    const result = logActivitySchema.safeParse({
      ...logActivityDefaults(ActivityType.Task),
      durationMinutes: '1441',
    });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Say what it was about',
      'Enter minutes, up to 1440',
      'Pick when the task is due',
    ]);
    expect(
      logActivitySchema.safeParse({
        ...logActivityDefaults(ActivityType.Call),
        subject: 'x',
        durationMinutes: '1.5',
      }).success,
    ).toBe(false);
  });

  it('starts a task not done and everything else done', () => {
    expect(logActivityDefaults(ActivityType.Task).done).toBe(false);
    expect(logActivityDefaults(ActivityType.Note).done).toBe(true);
  });
});

describe('DetailActions and LogActivityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.user.mockReturnValue({ name: 'Priya' });
    gql.create.mockResolvedValue({ data: { createActivity: { id: 'a-1' } } });
  });

  it('offers the quick actions', () => {
    renderActions();
    for (const name of ['Note', 'Log call', 'Task', 'Meeting', 'Add reminder']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('logs a call with its duration against the contact', async () => {
    renderActions();
    const dialog = await openLog('Log call');
    expect(within(dialog).getByText('Log activity')).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Type' })).toHaveTextContent('Call');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Subject' }), {
      target: { value: 'Intro call' },
    });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Duration (minutes)' }), {
      target: { value: '15' },
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log' }));

    await waitFor(() => expect(gql.create).toHaveBeenCalled());
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          type: ActivityType.Call,
          subject: 'Intro call',
          notes: '',
          relatedType: ActivitySubject.Contact,
          relatedId: 'contact-1',
          relatedName: 'Asha Rao',
          dueDate: null,
          done: true,
          owner: 'Priya',
          durationSeconds: 900,
          attachments: [],
        },
      },
    });
    expect(gql.options).toEqual({ refetchQueries: [CrmTimelineDocument] });
    expect(await screen.findByText('Activity created')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('logs a task with its due date against a company, with no owner when signed out', async () => {
    gql.user.mockReturnValue(null);
    renderActions({ relatedType: 'COMPANY', relatedId: 'company-1', relatedName: 'Acme' });
    const dialog = await openLog('Task');
    expect(
      within(dialog).queryByRole('textbox', { name: 'Duration (minutes)' }),
    ).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Subject' }), {
      target: { value: 'Send quote' },
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log' }));
    expect(await within(dialog).findByText('Pick when the task is due')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Due'), { target: { value: '2026-10-20' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log' }));
    await waitFor(() => expect(gql.create).toHaveBeenCalled());
    expect(gql.create.mock.calls[0][0].variables.input).toMatchObject({
      type: ActivityType.Task,
      relatedType: ActivitySubject.Company,
      dueDate: new Date('2026-10-20T12:00:00').toISOString(),
      done: false,
      owner: '',
      durationSeconds: null,
    });
  });

  it('switches the type inside the form', async () => {
    renderActions();
    const dialog = await openLog('Note');
    expect(
      within(dialog).queryByRole('textbox', { name: 'Duration (minutes)' }),
    ).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Type' }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Meeting' }),
    );
    expect(within(dialog).getByRole('textbox', { name: 'Duration (minutes)' })).toBeInTheDocument();
  });

  it('keeps the dialog open when saving failed, and cancels', async () => {
    gql.create.mockRejectedValue(new Error('Offline'));
    renderActions();
    const dialog = await openLog('Note');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Subject' }), {
      target: { value: 'Note' },
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log' }));
    expect(await screen.findByText('Offline')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

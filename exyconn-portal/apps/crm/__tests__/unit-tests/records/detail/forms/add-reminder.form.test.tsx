import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ActivitySubject,
  ActivityType,
  CrmCalendarDocument,
  CrmTimelineDocument,
} from '@exyconn/shell/graphql/generated';
import { DetailActions } from '../../../../../src/records/detail';
import {
  addReminderDefaults,
  addReminderSchema,
} from '../../../../../src/records/detail/forms/add-reminder';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), options: undefined as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateActivityMutation: (options: unknown) => {
    gql.options = options;
    return [gql.create];
  },
  useListEmployeeOptionsQuery: () => ({
    loading: false,
    data: {
      listEmployeeOptions: [
        { id: 'u-1', name: 'Priya', email: 'priya@acme.test' },
        { id: 'u-2', name: 'Ravi', email: 'ravi@acme.test' },
      ],
    },
  }),
}));
vi.mock('@exyconn/shell/auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1', name: 'Priya' } }),
}));
/** The MUI X date-and-time picker as a text box that sends whatever instant is typed. */
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  DateTimePicker: ({
    label,
    onChange,
  }: Readonly<{ label: string; onChange: (date: Date | null) => void }>) => (
    <input aria-label={label} onChange={(event) => onChange(new Date(event.target.value))} />
  ),
}));

const inAnHour = () => new Date(Date.now() + 3_600_000).toISOString();

describe('addReminderSchema', () => {
  it('needs a title, a future time and somebody to remind', () => {
    const result = addReminderSchema.safeParse({
      ...addReminderDefaults(''),
      remindAt: new Date(Date.now() - 60_000).toISOString(),
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Say what to be reminded about',
      'Pick a time in the future',
      'Choose who to remind',
    ]);
    expect(addReminderSchema.safeParse(addReminderDefaults('u-1')).error?.issues[1].message).toBe(
      'Pick when to be reminded',
    );
  });

  it('accepts a complete reminder for later', () => {
    expect(
      addReminderSchema.safeParse({
        ...addReminderDefaults('u-1'),
        subject: 'Chase',
        remindAt: inAnHour(),
      }).success,
    ).toBe(true);
  });
});

describe('adding a reminder from a record', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createActivity: { id: 'a-1' } } });
  });

  it('files a task due at the reminder time, for me unless I pick somebody else', async () => {
    renderWithProviders(
      <DetailActions
        target={{ relatedType: 'COMPANY', relatedId: 'company-1', relatedName: 'Acme' }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add reminder' }));
    const dialog = await screen.findByRole('dialog');
    const at = inAnHour();

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Chase the contract' },
    });
    fireEvent.change(within(dialog).getByLabelText('Remind at'), { target: { value: at } });
    expect(within(dialog).getByRole('combobox', { name: 'Assignee' })).toHaveTextContent(
      'Priya (priya@acme.test)',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add reminder' }));

    await waitFor(() => expect(gql.create).toHaveBeenCalled());
    expect(gql.create.mock.calls[0][0].variables.input).toEqual({
      type: ActivityType.Task,
      subject: 'Chase the contract',
      notes: '',
      relatedType: ActivitySubject.Company,
      relatedId: 'company-1',
      relatedName: 'Acme',
      dueDate: at,
      remindAt: at,
      assigneeId: 'u-1',
      done: false,
      owner: 'Priya',
    });
    expect(gql.options).toEqual({ refetchQueries: [CrmTimelineDocument, CrmCalendarDocument] });
    expect(await screen.findByText('Reminder created')).toBeInTheDocument();
  });

  it('says what is missing instead of saving', async () => {
    renderWithProviders(
      <DetailActions
        target={{ relatedType: 'CONTACT', relatedId: 'contact-1', relatedName: 'Asha' }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add reminder' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add reminder' }));

    expect(await within(dialog).findByText('Say what to be reminded about')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });
});

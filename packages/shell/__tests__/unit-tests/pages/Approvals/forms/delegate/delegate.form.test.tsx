import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DelegateApprovalsDocument, ListEmployeeOptionsDocument } from '@/graphql/generated';
import { DelegateApprovalsForm } from '@/pages/Approvals/forms/delegate';
import { renderWithProviders } from '../../../../test-utils';
import { answer, failure } from '../../../../mockResult';

const COLLEAGUE = {
  __typename: 'EmployeeOption',
  id: 'emp-2',
  name: 'Ravi Kumar',
  email: 'ravi@example.com',
  designation: 'Engineering Manager',
  department: 'Engineering',
};

const people = answer(ListEmployeeOptionsDocument, { listEmployeeOptions: [COLLEAGUE] });

/** Local midnight as the ISO string the picker stores. */
const localIso = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day).toISOString();

function arranged(note: string | null) {
  return answer(
    DelegateApprovalsDocument,
    {
      delegateApprovals: {
        __typename: 'ApprovalDelegation',
        id: 'delegation-1',
        toName: COLLEAGUE.name,
        fromDate: localIso(2026, 6, 15),
        toDate: localIso(2026, 6, 30),
        active: true,
      },
    },
    {
      input: {
        toEmployeeId: COLLEAGUE.id,
        fromDate: localIso(2026, 6, 15),
        toDate: localIso(2026, 6, 30),
        note,
      },
    },
  );
}

const input = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;

function mount(mocks = [people.mock]) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<DelegateApprovalsForm onDone={onDone} onCancel={onCancel} />, { mocks });
  return { onDone, onCancel };
}

async function fill(user: ReturnType<typeof userEvent.setup>, from: string, to: string) {
  await user.type(input('toEmployeeId'), 'Ravi');
  await user.click(
    await screen.findByRole('option', { name: `${COLLEAGUE.name} (${COLLEAGUE.email})` }),
  );
  fireEvent.change(input('fromDate'), { target: { value: from } });
  fireEvent.change(input('toDate'), { target: { value: to } });
}

const submit = () => screen.getByRole('button', { name: 'Arrange cover' });

describe('the arrange-cover form', () => {
  it('asks who covers you and for both ends of the window', async () => {
    const user = userEvent.setup();
    const { onDone } = mount();

    await user.click(submit());

    expect(await screen.findByText('Choose who will cover you')).toBeInTheDocument();
    expect(screen.getByText('Say when it starts')).toBeInTheDocument();
    expect(screen.getByText('Say when it ends')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('refuses a window that ends before it begins', async () => {
    const user = userEvent.setup();
    const { onDone } = mount();
    await fill(user, '06/15/2026', '06/14/2026');

    await user.click(submit());

    expect(await screen.findByText('The last day cannot be before the first')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('keeps the note under 200 characters', async () => {
    const user = userEvent.setup();
    mount();
    await fill(user, '06/15/2026', '06/30/2026');
    fireEvent.change(input('note'), { target: { value: 'x'.repeat(201) } });

    await user.click(submit());

    expect(await screen.findByText('Keep the note under 200 characters')).toBeInTheDocument();
  });

  it('arranges the cover with no note, and says so', async () => {
    const user = userEvent.setup();
    const done = arranged(null);
    const { onDone } = mount([people.mock, done.mock]);
    await fill(user, '06/15/2026', '06/30/2026');

    await user.click(submit());

    expect(
      await screen.findByText('Your approvals are covered for that window.'),
    ).toBeInTheDocument();
    expect(done.delivered()).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sends the note when there is one', async () => {
    const user = userEvent.setup();
    const done = arranged('Back on the 1st');
    const { onDone } = mount([people.mock, done.mock]);
    await fill(user, '06/15/2026', '06/30/2026');
    await user.type(input('note'), 'Back on the 1st');

    await user.click(submit());

    expect(
      await screen.findByText('Your approvals are covered for that window.'),
    ).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('says why the server refused, and stays open', async () => {
    const user = userEvent.setup();
    const refused = failure(
      DelegateApprovalsDocument,
      {
        input: {
          toEmployeeId: COLLEAGUE.id,
          fromDate: localIso(2026, 6, 15),
          toDate: localIso(2026, 6, 30),
          note: null,
        },
      },
      'Cover overlaps an existing one',
    );
    const { onDone } = mount([people.mock, refused]);
    await fill(user, '06/15/2026', '06/30/2026');

    await user.click(submit());

    expect(await screen.findByText('Cover overlaps an existing one')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('offers no colleagues until the list arrives, and cancels', async () => {
    const user = userEvent.setup();
    const { onCancel } = mount([failure(ListEmployeeOptionsDocument)]);

    await user.click(input('toEmployeeId'));
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

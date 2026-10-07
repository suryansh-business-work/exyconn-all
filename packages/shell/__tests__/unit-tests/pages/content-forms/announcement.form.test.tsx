import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnouncementAudience, AnnouncementCategory } from '@/graphql/generated';
import {
  NOW,
  choose,
  create,
  enter,
  fillRequired,
  renderForm,
  save,
  setUpAnnouncementMocks,
} from './announcementHarness';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useCreateAnnouncementMutation: vi.fn(),
  useUpdateAnnouncementMutation: vi.fn(),
  useListEmployeeOptionsQuery: vi.fn(),
}));

beforeEach(setUpAnnouncementMocks);

afterEach(() => {
  vi.useRealTimers();
});

describe('AnnouncementForm — creating', () => {
  it('starts as a notice to everybody, published now and never expiring', async () => {
    const onDone = renderForm(null);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Notice');
    await fillRequired();
    await save();

    expect(await screen.findByText('Announcement created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Office closed Friday',
          body: 'The office is closed for maintenance.',
          category: AnnouncementCategory.Notice,
          pinned: false,
          publishedAt: NOW.toISOString(),
          expiresAt: null,
          audience: AnnouncementAudience.All,
          department: null,
          employeeIds: null,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("starts as the screen's first kind when Notice is not offered", () => {
    renderForm(null, [AnnouncementCategory.Maintenance, AnnouncementCategory.Outage]);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Maintenance');
  });

  it('needs a title and a message, and a title of 120 characters at most', async () => {
    renderForm(null);
    await save();
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Message is required')).toBeInTheDocument();

    await enter('Title', 'x'.repeat(121));
    expect(await screen.findByText('Keep it under 120 characters')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('sends to one department, chosen from the sorted departments people belong to', async () => {
    renderForm(null);
    await fillRequired();
    await choose('Audience', 'Department');
    await save();
    expect(await screen.findByText('Pick a department')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: 'Department' }));
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Engineering', 'Sales']);
    await userEvent.click(options[1]);
    await save();

    await expect.poll(() => create.mock.calls.length).toBe(1);
    expect(create.mock.calls[0][0].variables.input).toMatchObject({
      audience: AnnouncementAudience.Department,
      department: 'Sales',
      employeeIds: null,
    });
  });

  it('sends to named employees, at least one of them', async () => {
    renderForm(null);
    await fillRequired();
    await choose('Audience', 'Employees');
    await save();
    expect(await screen.findByText('Pick at least one employee')).toBeInTheDocument();

    await choose('Employees', 'Ben (ben@example.com)');
    await userEvent.keyboard('{Escape}');
    await save();

    await expect.poll(() => create.mock.calls.length).toBe(1);
    expect(create.mock.calls[0][0].variables.input).toMatchObject({
      audience: AnnouncementAudience.Employees,
      department: null,
      employeeIds: ['u-2'],
    });
  });

  it('offers no departments before the people list arrives', async () => {
    renderForm(null, undefined, null);
    await choose('Audience', 'Department');
    await userEvent.click(screen.getByRole('combobox', { name: 'Department' }));
    expect(within(screen.getByRole('listbox')).queryAllByRole('option')).toHaveLength(0);
  });
});

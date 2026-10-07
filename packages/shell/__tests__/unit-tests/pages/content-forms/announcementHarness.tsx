import { vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  type AnnouncementCategory,
  useCreateAnnouncementMutation,
  useListEmployeeOptionsQuery,
  useUpdateAnnouncementMutation,
} from '@/graphql/generated';
import { AnnouncementForm, type AnnouncementRow } from '@/pages/content-forms';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple, queryResult } from '../hookMocks';

/*
 * Shared by the announcement form's tests. Each test file mocks '@/graphql/generated' itself
 * (vi.mock is per file), so the hooks imported here are that file's mocks.
 */

export const NOW = new Date('2026-05-01T09:00:00.000Z');
export const create = vi.fn();
export const update = vi.fn();

const people = [
  { id: 'u-1', name: 'Asha', email: 'asha@example.com', department: 'Sales' },
  { id: 'u-2', name: 'Ben', email: 'ben@example.com', department: 'Engineering' },
  { id: 'u-3', name: 'Chen', email: 'chen@example.com', department: 'Sales' },
  { id: 'u-4', name: 'Dev', email: 'dev@example.com', department: null },
];

export function renderForm(
  initial: AnnouncementRow | null,
  categories?: readonly AnnouncementCategory[],
  users: unknown[] | null = people,
) {
  vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(
    queryResult(users ? { listEmployeeOptions: users } : undefined) as never,
  );
  const onDone = vi.fn();
  renderWithProviders(
    <AnnouncementForm
      initial={initial}
      onDone={onDone}
      onCancel={vi.fn()}
      categories={categories}
    />,
  );
  return onDone;
}

export async function choose(field: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: field }));
  await userEvent.click(within(screen.getByRole('listbox')).getByText(option));
}

export async function enter(label: string, value: string) {
  await userEvent.click(screen.getByRole('textbox', { name: label }));
  await userEvent.paste(value);
}

export async function fillRequired() {
  await enter('Title', 'Office closed Friday');
  await enter('Message', 'The office is closed for maintenance.');
}

export const save = (name = 'Create') => userEvent.click(screen.getByRole('button', { name }));

/** Fixes the clock (a new announcement publishes "now") and resets the mutations. */
export function setUpAnnouncementMocks() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreateAnnouncementMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdateAnnouncementMutation).mockReturnValue(mutationTuple(update) as never);
}

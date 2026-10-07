import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMyNotificationPreferencesQuery,
  useSetMyNotificationPreferenceMutation,
} from '@/graphql/generated';
import { NotificationPreferencesPanel } from '@/pages/Settings/NotificationPreferencesPanel';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple, queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useMyNotificationPreferencesQuery: vi.fn(),
  useSetMyNotificationPreferenceMutation: vi.fn(),
}));

const save = vi.fn();

function mockPreferences(preferences: unknown[] | undefined, extras = {}, saving = false) {
  vi.mocked(useMyNotificationPreferencesQuery).mockReturnValue(
    queryResult(preferences && { myNotificationPreferences: preferences }, extras) as never,
  );
  vi.mocked(useSetMyNotificationPreferenceMutation).mockReturnValue(
    mutationTuple(save, saving) as never,
  );
}

const leave = { kind: 'LEAVE', inPortal: true, email: false };
const unknownKind = { kind: 'NEW_KIND', inPortal: false, email: true };

beforeEach(() => {
  save.mockReset().mockResolvedValue({ data: {} });
});

describe('NotificationPreferencesPanel', () => {
  it('shows progress before the first load and no column headings', () => {
    mockPreferences(undefined, { loading: true });
    renderWithProviders(<NotificationPreferencesPanel />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Portal')).toBeNull();
  });

  it('reports preferences that could not load', () => {
    mockPreferences(undefined, { error: new Error('No preferences today') });
    renderWithProviders(<NotificationPreferencesPanel />);
    expect(screen.getByText('No preferences today')).toBeInTheDocument();
  });

  it('names each kind in plain words, falling back to the raw kind', () => {
    mockPreferences([leave, unknownKind], { loading: true });
    renderWithProviders(<NotificationPreferencesPanel />);

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('Portal')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Leave decisions in the portal' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Leave decisions by email' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'NEW_KIND by email' })).toBeChecked();
  });

  it('saves the portal switch with the email choice unchanged', async () => {
    mockPreferences([leave]);
    renderWithProviders(<NotificationPreferencesPanel />);

    await userEvent.click(screen.getByRole('switch', { name: 'Leave decisions in the portal' }));

    expect(save).toHaveBeenCalledWith({
      variables: { input: { kind: 'LEAVE', inPortal: false, email: false } },
    });
  });

  it('saves the email switch with the portal choice unchanged', async () => {
    mockPreferences([leave]);
    renderWithProviders(<NotificationPreferencesPanel />);

    await userEvent.click(screen.getByRole('switch', { name: 'Leave decisions by email' }));

    expect(save).toHaveBeenCalledWith({
      variables: { input: { kind: 'LEAVE', inPortal: true, email: true } },
    });
  });

  it('tells the person when a preference could not be saved', async () => {
    save.mockRejectedValueOnce('server unreachable');
    mockPreferences([leave]);
    renderWithProviders(<NotificationPreferencesPanel />);

    await userEvent.click(screen.getByRole('switch', { name: 'Leave decisions by email' }));

    expect(await screen.findByText('That preference could not be saved.')).toBeInTheDocument();
  });

  it('locks the switches while a save is in flight', () => {
    mockPreferences([leave], {}, true);
    renderWithProviders(<NotificationPreferencesPanel />);
    expect(screen.getByRole('switch', { name: 'Leave decisions by email' })).toBeDisabled();
  });
});

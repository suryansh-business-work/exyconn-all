import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AnnouncementAudience, AnnouncementCategory } from '@/graphql/generated';
import type { AnnouncementRow } from '@/pages/content-forms';
import { renderForm, save, setUpAnnouncementMocks, update } from './announcementHarness';

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

describe('AnnouncementForm — editing', () => {
  const row: AnnouncementRow = {
    id: 'an-1',
    title: 'Town hall',
    body: 'All hands in the atrium.',
    category: AnnouncementCategory.Event,
    pinned: true,
    publishedAt: '2026-05-10T00:00:00.000Z',
    expiresAt: '2026-05-20T00:00:00.000Z',
    audience: AnnouncementAudience.All,
    department: null,
    employeeIds: [],
  };

  it('keeps its own values and expiry when saved', async () => {
    const onDone = renderForm(row);
    await save('Update');

    expect(await screen.findByText('Announcement updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'an-1',
        input: {
          title: 'Town hall',
          body: 'All hands in the atrium.',
          category: AnnouncementCategory.Event,
          pinned: true,
          publishedAt: '2026-05-10T00:00:00.000Z',
          expiresAt: '2026-05-20T00:00:00.000Z',
          audience: AnnouncementAudience.All,
          department: null,
          employeeIds: null,
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('refuses an expiry that is not after the publish date', async () => {
    renderForm({ ...row, expiresAt: '2026-05-01T00:00:00.000Z' });
    await save('Update');
    expect(await screen.findByText('Expiry must be after the publish date')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it('needs a publish date', async () => {
    renderForm({ ...row, publishedAt: '', expiresAt: null });
    await save('Update');
    expect(await screen.findByText('Publish date is required')).toBeInTheDocument();
  });
});

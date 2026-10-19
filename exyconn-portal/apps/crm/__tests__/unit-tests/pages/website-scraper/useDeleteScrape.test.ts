import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useDeleteScrape } from '../../../../src/pages/website-scraper/useDeleteScrape';
import { renderHookWithProviders } from '../../test-utils';
import { scrapeRow } from './scraper-fixtures';

const gql = vi.hoisted(() => ({ deleteScrape: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteWebScrapeMutation: () => [gql.deleteScrape, { loading: gql.loading }],
}));

function renderDelete() {
  const onDeleted = vi.fn();
  const { result } = renderHookWithProviders(() => useDeleteScrape(onDeleted));
  return { result, onDeleted };
}

/** Starts a delete, answers the confirm dialog with `answer`, and returns what it asked. */
async function runAndAnswer(
  run: () => Promise<void>,
  answer: 'Delete' | 'Cancel',
): Promise<string> {
  let done: Promise<void> = Promise.resolve();
  act(() => {
    done = run();
  });
  const dialog = await screen.findByRole('dialog');
  // The dialog opens before its options land: the destructive button shows once they have.
  await within(dialog).findByRole('button', { name: 'Delete' });
  const button = within(dialog).getByRole('button', { name: answer });
  const question = dialog.textContent ?? '';
  await userEvent.click(button);
  await act(() => done);
  return question;
}

describe('useDeleteScrape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.loading = false;
    gql.deleteScrape.mockResolvedValue({ data: { deleteWebScrape: true } });
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('deletes the page once confirmed, says so and tells the caller', async () => {
    const { result, onDeleted } = renderDelete();

    const question = await runAndAnswer(() => result.current.run(scrapeRow()), 'Delete');

    expect(question).toContain(
      'Delete the scraped page "About Acme"? Its text and AI answer go with it.',
    );
    expect(gql.deleteScrape).toHaveBeenCalledWith({ variables: { id: 'scrape-1' } });
    expect(await screen.findByText('Scraped page deleted')).toBeInTheDocument();
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('names an untitled page by its URL and deletes nothing when cancelled', async () => {
    const { result, onDeleted } = renderDelete();

    const question = await runAndAnswer(
      () => result.current.run(scrapeRow({ title: '' })),
      'Cancel',
    );

    expect(question).toContain('Delete the scraped page "https://acme.com/about"?');
    expect(gql.deleteScrape).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("logs a failed delete and shows the server's reason", async () => {
    const failure = new Error('Already deleted');
    gql.deleteScrape.mockRejectedValue(failure);
    const { result, onDeleted } = renderDelete();

    await runAndAnswer(() => result.current.run(scrapeRow()), 'Delete');

    expect(await screen.findByText('Already deleted')).toBeInTheDocument();
    expect(portalLogger.warn).toHaveBeenCalledWith('crm: deleting a scraped page failed', failure);
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.deleteScrape.mockRejectedValue('offline');
    const { result } = renderDelete();

    await runAndAnswer(() => result.current.run(scrapeRow()), 'Delete');

    expect(await screen.findByText('Could not delete the scraped page.')).toBeInTheDocument();
  });

  it('reports when a delete is running', () => {
    gql.loading = true;
    const { result } = renderDelete();

    expect(result.current.deleting).toBe(true);
  });
});

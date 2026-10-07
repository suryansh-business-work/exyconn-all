import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePublishPolicyMutation } from '@/graphql/generated';
import { usePublishPolicy } from '@/pages/content-forms';
import { HookWrapper } from '../hookWrapper';
import { mutationTuple } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  usePublishPolicyMutation: vi.fn(),
}));

const publish = vi.fn();
const draft = { id: 'pol-1', title: 'Leave policy', status: 'DRAFT', version: 1 };
const live = { ...draft, status: 'PUBLISHED', version: 3 };
/** The text of every question the hook asked, in order. */
const shown: string[] = [];

/** Starts publishing a row, answers the question and waits for the hook to finish. */
async function publishAnswering(
  row: typeof draft,
  answer: string,
  onPublished = vi.fn().mockResolvedValue(undefined),
) {
  const { result } = renderHook(() => usePublishPolicy(onPublished), { wrapper: HookWrapper });
  let done: Promise<void> = Promise.resolve();
  act(() => {
    done = result.current(row);
  });
  shown.push((await screen.findByRole('dialog')).textContent ?? '');
  await userEvent.click(await screen.findByRole('button', { name: answer }));
  await act(async () => done);
  return onPublished;
}

beforeEach(() => {
  shown.length = 0;
  publish.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(usePublishPolicyMutation).mockReturnValue(mutationTuple(publish) as never);
});

describe('usePublishPolicy', () => {
  it('publishes a draft without raising the version', async () => {
    const onPublished = await publishAnswering(draft, 'Publish');

    expect(shown[0]).toContain(
      'Publish "Leave policy"? Staff will be able to read it straight away.',
    );
    expect(publish).toHaveBeenCalledWith({ variables: { id: 'pol-1', raiseVersion: false } });
    expect(onPublished).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Policy published')).toBeInTheDocument();
  });

  it('asks whether the wording changed before republishing as a new version', async () => {
    await publishAnswering(live, 'Yes, new version');

    expect(shown[0]).toContain(
      'Has the wording of "Leave policy" changed? Choosing yes makes it v4 and asks everybody to sign again.',
    );
    expect(publish).toHaveBeenCalledWith({ variables: { id: 'pol-1', raiseVersion: true } });
    expect(await screen.findByText('Published as a new version')).toBeInTheDocument();
  });

  it('does nothing when the question is cancelled', async () => {
    const onPublished = await publishAnswering(draft, 'Cancel');
    expect(publish).not.toHaveBeenCalled();
    expect(onPublished).not.toHaveBeenCalled();
  });

  it("reports the server's reason when publishing fails", async () => {
    publish.mockRejectedValueOnce(new Error('Policy has no body'));
    const onPublished = await publishAnswering(draft, 'Publish');
    expect(await screen.findByText('Policy has no body')).toBeInTheDocument();
    expect(onPublished).not.toHaveBeenCalled();
  });

  it('uses a generic message when the reload after publishing fails oddly', async () => {
    await publishAnswering(draft, 'Publish', vi.fn().mockRejectedValue('offline'));
    expect(await screen.findByText('Could not publish')).toBeInTheDocument();
  });

  it('accepts a callback that returns nothing', async () => {
    const onPublished = vi.fn();
    await publishAnswering(draft, 'Publish', onPublished);
    expect(await screen.findByText('Policy published')).toBeInTheDocument();
  });
});

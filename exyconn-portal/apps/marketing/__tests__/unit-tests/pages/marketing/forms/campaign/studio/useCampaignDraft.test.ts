import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useCampaignDraft } from '../../../../../../../src/pages/marketing/forms/campaign/studio/useCampaignDraft';
import {
  toDraftInput,
  toStudioValues,
  type CampaignRow,
  type CampaignStudioInput,
  type CampaignStudioValues,
} from '../../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import { campaignRow } from '../../../../../fixtures';

const gql = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveCampaignDraftMutation: () => [gql.save],
}));

/** The studio's form and its draft hook together, as the studio wires them. */
function renderDraft(initial: CampaignRow | null = null) {
  return renderHook(() => {
    const form = useForm<CampaignStudioInput, unknown, CampaignStudioValues>({
      defaultValues: toStudioValues(initial, 'hello@exyconn.com', 'INR'),
    });
    return { form, draft: useCampaignDraft(form.control, initial) };
  });
}

type Rendered = ReturnType<typeof renderDraft>['result'];

const type = (result: Rendered, field: 'name' | 'replyTo' | 'subject', value: string) =>
  act(() => {
    result.current.form.setValue(field, value);
  });

const saveNow = async (result: Rendered) => {
  let saved = false;
  await act(async () => {
    saved = await result.current.draft.save();
  });
  return saved;
};

describe('useCampaignDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.save.mockImplementation(({ variables }) =>
      Promise.resolve({
        data: {
          saveCampaignDraft: campaignRow({
            id: variables.id ?? 'campaign-new',
            name: variables.input.name,
            contentVersion: (variables.expectedVersion ?? 0) + 1,
          }),
        },
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a new campaign unsaved, with nothing to save until it has a name', async () => {
    const { result } = renderDraft();
    expect(result.current.draft).toMatchObject({
      campaign: null,
      status: 'idle',
      error: null,
      dirty: true,
    });
    expect(await saveNow(result)).toBe(false);
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('creates the draft on the first save and is then clean', async () => {
    const { result } = renderDraft();
    type(result, 'name', 'Diwali offer');
    expect(await saveNow(result)).toBe(true);
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        id: null,
        input: toDraftInput(result.current.form.getValues()),
        expectedVersion: null,
      },
    });
    expect(result.current.draft).toMatchObject({ status: 'saved', dirty: false, error: null });
    expect(result.current.draft.campaign?.id).toBe('campaign-new');
  });

  it('does not save again when nothing changed', async () => {
    const { result } = renderDraft();
    type(result, 'name', 'Diwali offer');
    await saveNow(result);
    expect(await saveNow(result)).toBe(true);
    expect(gql.save).toHaveBeenCalledTimes(1);
  });

  it('saves later changes against the id and version the last save returned', async () => {
    const { result } = renderDraft();
    type(result, 'name', 'Diwali offer');
    await saveNow(result);
    type(result, 'subject', 'Festive savings');
    expect(result.current.draft.dirty).toBe(true);
    await saveNow(result);
    expect(gql.save).toHaveBeenLastCalledWith({
      variables: expect.objectContaining({ id: 'campaign-new', expectedVersion: 1 }),
    });
  });

  it('does not save a reply-to address that is not an email', async () => {
    const { result } = renderDraft();
    type(result, 'name', 'Diwali offer');
    type(result, 'replyTo', 'not-an-email');
    expect(await saveNow(result)).toBe(false);
    type(result, 'replyTo', 'sales@exyconn.com');
    expect(await saveNow(result)).toBe(true);
  });

  it('reports a failed save and keeps the changes unsaved', async () => {
    gql.save.mockRejectedValueOnce(new Error('Someone else changed this campaign'));
    const { result } = renderDraft();
    type(result, 'name', 'Diwali offer');
    expect(await saveNow(result)).toBe(false);
    expect(result.current.draft).toMatchObject({
      status: 'failed',
      error: 'Someone else changed this campaign',
      dirty: true,
    });
    expect(await saveNow(result)).toBe(true);
    expect(result.current.draft).toMatchObject({ status: 'saved', error: null });
  });

  it('uses a plain message when the failure has none', async () => {
    gql.save.mockRejectedValueOnce('boom');
    const { result } = renderDraft();
    type(result, 'name', 'Diwali offer');
    await saveNow(result);
    expect(result.current.draft.error).toBe('The draft could not be saved');
  });

  it('keeps no campaign when the server answers without one', async () => {
    gql.save.mockResolvedValueOnce({ data: null });
    const { result } = renderDraft();
    type(result, 'name', 'Diwali offer');
    expect(await saveNow(result)).toBe(true);
    expect(result.current.draft.campaign).toBeNull();
  });

  it('runs saves one at a time, so the second sees the first one’s version', async () => {
    const { result } = renderDraft();
    type(result, 'name', 'Diwali offer');
    await act(async () => {
      const first = result.current.draft.save();
      const second = result.current.draft.save();
      expect(await Promise.all([first, second])).toEqual([true, true]);
    });
    expect(gql.save).toHaveBeenCalledTimes(1);
  });

  it('saves on its own after a pause in typing', async () => {
    vi.useFakeTimers();
    const { result } = renderDraft();
    type(result, 'name', 'Diwali');
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    type(result, 'name', 'Diwali offer');
    await act(async () => {
      vi.advanceTimersByTime(1499);
    });
    expect(gql.save).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(gql.save).toHaveBeenCalledTimes(1);
    expect(gql.save.mock.calls[0][0].variables.input.name).toBe('Diwali offer');
    expect(result.current.draft.status).toBe('saved');
  });

  it('opens a saved campaign as saved and clean', async () => {
    vi.useFakeTimers();
    const row = campaignRow();
    const { result } = renderDraft(row);
    expect(result.current.draft).toMatchObject({ campaign: row, status: 'saved', dirty: false });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('takes a fresher copy and saves the next change against it', async () => {
    const { result } = renderDraft(campaignRow());
    const fresher = campaignRow({ contentVersion: 7 });
    act(() => result.current.draft.refreshed(fresher));
    expect(result.current.draft.campaign).toBe(fresher);
    type(result, 'subject', 'New subject');
    await saveNow(result);
    expect(gql.save).toHaveBeenCalledWith({
      variables: expect.objectContaining({ id: 'campaign-1', expectedVersion: 7 }),
    });
  });
});

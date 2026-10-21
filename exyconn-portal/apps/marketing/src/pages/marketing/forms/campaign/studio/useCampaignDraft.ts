import { useCallback, useEffect, useRef, useState } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { EMAIL } from '@exyconn/regex';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSaveCampaignDraftMutation } from '@exyconn/shell/graphql/generated';
import {
  toDraftInput,
  type CampaignRow,
  type CampaignStudioInput,
  type CampaignStudioValues,
} from '../campaign.types';

/** Long enough that typing is one save, short enough that little is ever lost. */
const AUTOSAVE_MS = 1500;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface CampaignDraftState {
  campaign: CampaignRow | null;
  status: SaveStatus;
  error: string | null;
  /** True while the form holds changes the server does not have. */
  dirty: boolean;
  /** Saves now (Save draft, before Next). Resolves true when the server has everything. */
  save: () => Promise<boolean>;
  /** Takes a fresher copy of the campaign from the server (after a send was queued). */
  refreshed: (row: CampaignRow) => void;
}

/** Whether the draft can be saved at all: it needs a name, and anything typed must be valid. */
const isSavable = (values: CampaignStudioInput) =>
  values.name.trim() !== '' && (values.replyTo.trim() === '' || EMAIL.test(values.replyTo.trim()));

/**
 * Keeps the draft saved. Every change is saved after a pause; saves run one at a time, each
 * against the version the last one returned, so a second window's edit is reported rather
 * than silently overwritten.
 */
export function useCampaignDraft(
  control: Control<CampaignStudioInput, unknown, CampaignStudioValues>,
  initial: CampaignRow | null,
): CampaignDraftState {
  const [saveDraft] = useSaveCampaignDraftMutation();
  const values = useWatch({ control }) as CampaignStudioInput;
  const key = JSON.stringify(toDraftInput(values));
  const [campaign, setCampaign] = useState<CampaignRow | null>(initial);
  const [status, setStatus] = useState<SaveStatus>(initial ? 'saved' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const savedKey = useRef<string | null>(initial ? key : null);
  const latest = useRef({ values, key, campaign });
  latest.current = { values, key, campaign: latest.current.campaign ?? campaign };
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));

  const runSave = useCallback(async (): Promise<boolean> => {
    const { values: current, key: currentKey, campaign: saved } = latest.current;
    if (currentKey === savedKey.current) {
      return true;
    }
    if (!isSavable(current)) {
      return false;
    }
    setStatus('saving');
    try {
      const res = await saveDraft({
        variables: {
          id: saved?.id ?? null,
          input: toDraftInput(current),
          expectedVersion: saved?.contentVersion ?? null,
        },
      });
      const next = res.data?.saveCampaignDraft ?? null;
      savedKey.current = currentKey;
      latest.current.campaign = next;
      setCampaign(next);
      setStatus('saved');
      setError(null);
      return true;
    } catch (err) {
      setStatus('failed');
      setError(errorMessage(err, 'The draft could not be saved'));
      return false;
    }
  }, [saveDraft]);

  const save = useCallback(() => {
    queue.current = queue.current.then(runSave, runSave);
    return queue.current;
  }, [runSave]);

  useEffect(() => {
    if (key === savedKey.current) {
      return undefined;
    }
    const timer = globalThis.setTimeout(() => {
      save().catch((err: unknown) => setError(errorMessage(err, 'The draft could not be saved')));
    }, AUTOSAVE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [key, save]);

  const refreshed = useCallback((row: CampaignRow) => {
    latest.current.campaign = row;
    setCampaign(row);
  }, []);

  return { campaign, status, error, dirty: key !== savedKey.current, save, refreshed };
}

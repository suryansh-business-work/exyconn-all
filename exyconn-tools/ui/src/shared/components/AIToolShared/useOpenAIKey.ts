import { useCallback, useState } from 'react';
import { readSecret } from '../../services/secrets';
import { OPENAI_SECRET_KEY, isKeyRejected } from '../../services/openai';

interface UseOpenAIKeyResult {
  /** True once an action found no key, or OpenAI rejected the one we sent. */
  needsKey: boolean;
  /** Returns the stored key, flagging `needsKey` when there isn't one. */
  requireKey: () => string;
  /** Turns a failed OpenAI call into a key prompt when the key was the problem. */
  reportError: (error: unknown) => void;
}

/**
 * Key handling for every OpenAI-backed tool, in one place.
 *
 * The key is read at the moment it is used rather than once on mount, so a key
 * saved in the secrets drawer while the tool is open takes effect immediately.
 * `needsKey` drives a <MissingKeyAlert> next to the action that failed.
 */
export const useOpenAIKey = (): UseOpenAIKeyResult => {
  const [needsKey, setNeedsKey] = useState(false);

  const requireKey = useCallback(() => {
    const apiKey = readSecret(OPENAI_SECRET_KEY);
    setNeedsKey(!apiKey);
    return apiKey;
  }, []);

  const reportError = useCallback((error: unknown) => {
    if (isKeyRejected(error)) {
      setNeedsKey(true);
    }
  }, []);

  return { needsKey, requireKey, reportError };
};

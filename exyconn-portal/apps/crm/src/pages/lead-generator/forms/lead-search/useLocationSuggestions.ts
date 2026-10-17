import { useEffect, useState } from 'react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useLeadLocationSuggestionsQuery } from '@exyconn/shell/graphql/generated';

/** Typing pauses this long before Google is asked for places. */
const DEBOUNCE_MS = 300;
/** Shorter input gets no suggestions (the server answers [] anyway). */
const MIN_CHARS = 2;

/**
 * Cities, areas, postcodes and countries matching what is typed in "Where", from Google
 * Places through the server's key, so it works without a Maps JavaScript key. A failure is
 * logged and simply leaves the list empty: typing a place by hand still works.
 */
export function useLocationSuggestions(input: string) {
  const [debounced, setDebounced] = useState(input);
  useEffect(() => {
    const timer = globalThis.setTimeout(() => setDebounced(input.trim()), DEBOUNCE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [input]);

  const skip = debounced.length < MIN_CHARS;
  const { data, previousData, loading, error } = useLeadLocationSuggestionsQuery({
    variables: { input: debounced },
    skip,
  });
  useEffect(() => {
    if (error) {
      portalLogger.warn('crm: lead location suggestions failed', error);
    }
  }, [error]);

  const suggestions = skip ? [] : (data ?? previousData)?.leadLocationSuggestions;
  return { suggestions: suggestions ?? [], loading: !skip && loading };
}

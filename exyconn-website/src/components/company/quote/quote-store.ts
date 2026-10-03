import { useSyncExternalStore } from "react";
import { DEFAULT_QUOTE_INPUT, type QuoteInput } from "../../../lib/company/quote";

/**
 * The quote as it is being filled in, shared between the form island and the summary panel
 * island (two islands, one module instance). The form writes; the panel reads.
 */
export interface QuoteDraft {
  input: QuoteInput;
  description: string;
}

const INITIAL: QuoteDraft = { input: DEFAULT_QUOTE_INPUT, description: "" };

let draft = INITIAL;
const listeners = new Set<() => void>();

export const setQuoteDraft = (next: QuoteDraft): void => {
  draft = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useQuoteDraft = (): QuoteDraft =>
  useSyncExternalStore(
    subscribe,
    () => draft,
    () => INITIAL
  );

import { createContext, useContext } from "react";
import type { QuoteText } from "./quote.types";

/** The quote form's words, provided once by QuoteForm for every step inside it. */
export const QuoteTextContext = createContext<QuoteText | null>(null);

export function useQuoteText(): QuoteText {
  const text = useContext(QuoteTextContext);
  if (!text) {
    throw new Error("useQuoteText must be used inside QuoteForm.");
  }
  return text;
}

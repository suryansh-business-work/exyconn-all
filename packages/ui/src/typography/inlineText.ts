import { createContext } from 'react';

/**
 * True inside a Text, Paragraph or Heading. A `Text` there is part of a sentence and stays
 * inline; anywhere else it is a line of its own, so two Texts stacked in a plain Box never
 * run together ("Ravi Sharma01 Oct 2026").
 */
export const InlineTextContext = createContext(false);

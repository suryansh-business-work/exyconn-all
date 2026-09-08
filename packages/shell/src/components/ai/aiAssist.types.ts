import type { AiDraftKind, SummaryStyle } from '../../graphql/generated';

/** What the caller wants done with the text it is handing over. */
export type AiAssistTask =
  { action: 'SUMMARISE'; style?: SummaryStyle } | { action: 'DRAFT'; kind: AiDraftKind };

export interface AiAssistButtonProps {
  task: AiAssistTask;
  /** The text to work on. The button is disabled while it is empty. */
  text: string;
  /** Receives the model's answer when the user accepts it. */
  onResult: (result: string) => void;
  /** Overrides the button's own label, e.g. "Draft a reply". */
  label?: string;
  disabled?: boolean;
}

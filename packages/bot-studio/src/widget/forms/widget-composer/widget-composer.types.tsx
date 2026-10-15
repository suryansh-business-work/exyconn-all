import { z } from 'zod';

/** Longest message the widget sends; a chat question needs no more. */
export const MAX_WIDGET_MESSAGE = 1000;

export const widgetComposerSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Type a message first')
    .max(MAX_WIDGET_MESSAGE, 'Keep it under 1000 characters'),
});

export type WidgetComposerValues = z.infer<typeof widgetComposerSchema>;

export interface WidgetComposerProps {
  /** Sends the trimmed text to the chat. */
  onSend: (text: string) => void;
  placeholder: string;
}

import type { z } from 'zod';
import type { composerSchema } from './composer.schema';

export type ComposerValues = z.infer<typeof composerSchema>;

export interface ComposerProps {
  /** Sends the trimmed text to the chat. */
  onSend: (text: string) => void;
  /** Explains the decorative buttons (emoji, attach, camera, voice) that are not part of the demo. */
  onUnavailable: () => void;
}

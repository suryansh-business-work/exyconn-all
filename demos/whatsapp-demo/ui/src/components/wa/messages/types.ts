import type { BotContent } from '@exyconn/wa-flow';

/** Where a message sits in its run, and when it was sent. */
export interface Frame {
  tail: boolean;
  time: string;
}

/** Props of a renderer for one bot content type. */
export type ContentProps<T extends BotContent['type']> = Readonly<{
  content: Extract<BotContent, { type: T }>;
  frame: Frame;
}>;

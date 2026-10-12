import type { ReactNode } from 'react';

/** What one office format's "to PDF" tool says and accepts; the conversion flow is shared. */
export interface OfficeToPdfConfig {
  toolName: string;
  icon: ReactNode;
  color: string;
  hoverColor: string;
  /** The file input's `accept` attribute. */
  accept: string;
  isAcceptedFile: (name: string) => boolean;
  invalidFileMessage: string;
  dropTitle: string;
  supportedFormats: string;
  emptyHint: string;
}

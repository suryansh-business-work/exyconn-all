import { createContext, useContext, type ReactNode } from 'react';
import type { Channel } from '@exyconn/wa-flow';
import type { DemoBundle } from '@exyconn/wa-flow/engine';

/**
 * What a host app tells the bot studio's screens: which channel's demos they manage, where the
 * workflow list is routed, how a draft is previewed (the WhatsApp chat, or the website chat
 * widget) and what to show when the server refuses the person.
 */
export interface StudioConfig {
  channel: Channel;
  /** English source for page titles, e.g. "WhatsApp demo" ("{name} analytics"). */
  name: string;
  /** The workflow list's route in the host app; one workflow's editor is `<path>/<id>`. */
  workflowsPath: string;
  /** The draft running in the channel's own chat, in memory; the editor's Preview. */
  renderPreview: (bundle: DemoBundle, startWorkflow: string) => ReactNode;
  /** The refusal screen for a FORBIDDEN answer. */
  forbidden: ReactNode;
}

const StudioContext = createContext<StudioConfig | null>(null);

/** Wraps the studio's screens; pass a stable (memoised or module-level) `config`. */
export function StudioProvider({
  config,
  children,
}: Readonly<{ config: StudioConfig; children: ReactNode }>) {
  return <StudioContext.Provider value={config}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioConfig {
  const config = useContext(StudioContext);
  if (!config) {
    throw new Error('The bot studio screens must sit inside a StudioProvider.');
  }
  return config;
}

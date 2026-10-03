import type { DemoProfile, WorkflowDef } from '../schema';

/** A demo with its published workflows, in menu order — what a chat runs. */
export interface DemoBundle {
  demo: DemoProfile;
  workflows: readonly WorkflowDef[];
}

/** Formatting the screen supplies, bound to the viewer's locale and timezone. */
export interface Formatters {
  date: (ms: number) => string;
  time: (ms: number) => string;
  /** Short weekday and date for a slot picker, e.g. "Mon, 6 Oct". */
  day: (ms: number) => string;
  money: (rupees: number) => string;
}

/** The signed-in portal user, exposed to templates as `{{user.*}}`. */
export interface DemoUser {
  firstName: string;
  fullName: string;
  email: string;
  /** Empty when the profile has none. */
  phone: string;
}

export interface EngineContext {
  /** Epoch milliseconds. */
  now: number;
  user: DemoUser;
  /** Translates an English source string (the @exyconn/i18n key). */
  t: (source: string) => string;
  format: Formatters;
  /** Whether free text may be sent to the server's OpenAI reader. */
  ai: boolean;
  /** Multiplies every typing delay; 0.4 under reduced motion, 0 in a preview that wants it instant. */
  typingScale?: number;
}

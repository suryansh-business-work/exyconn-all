import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Box } from '@exyconn/ui';

/** `polite` waits for the reader to finish; `assertive` interrupts — errors only. */
export type Politeness = 'polite' | 'assertive';

type Announce = (message: string, politeness: Politeness) => void;

const AnnounceContext = createContext<Announce>(() => undefined);

/** On the page for a screen reader, invisible and unclickable for everybody else. */
const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/**
 * Theme defaults that keep MUI's visual notices quiet. An Alert or Snackbar is `role="alert"`
 * out of the box, so every one announced itself the moment it painted — static notes included,
 * and dynamic ones twice once they also went through this announcer. Speaking is this module's
 * job; an Alert only draws.
 */
export const QUIET_NOTICES = {
  components: {
    MuiAlert: { defaultProps: { role: 'none' } },
    MuiSnackbarContent: { defaultProps: { role: 'none' } },
  },
} as const;

interface Messages {
  polite: string;
  assertive: string;
}

/**
 * The app's ONE way of telling a screen reader something changed without moving focus: two
 * live regions that exist from the first paint (a region inserted together with its text is
 * often not read at all), filled by `useAnnounce`.
 */
export function LiveAnnouncer({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  const [messages, setMessages] = useState<Messages>({ polite: '', assertive: '' });
  // Several screens can speak in the same render (a status and an update notice on mount), and
  // the last would silently replace the rest — so what arrives together is read together.
  const batch = useRef<Record<Politeness, string[]>>({ polite: [], assertive: [] });

  const announce = useCallback<Announce>((message, politeness) => {
    const pending = batch.current[politeness];
    if (pending.includes(message)) {
      return;
    }
    if (pending.length === 0) {
      queueMicrotask(() => {
        batch.current[politeness] = [];
      });
    }
    pending.push(message);
    const text = pending.join(' ');
    setMessages((current) => ({ ...current, [politeness]: text }));
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <Box role="status" aria-live="polite" aria-atomic sx={VISUALLY_HIDDEN}>
        {messages.polite}
      </Box>
      <Box role="alert" aria-live="assertive" aria-atomic sx={VISUALLY_HIDDEN}>
        {messages.assertive}
      </Box>
    </AnnounceContext.Provider>
  );
}

/**
 * Announces `message` whenever it changes to a new, non-empty value. Pass `null` (or '') while
 * there is nothing to say. Use `assertive` for errors, `polite` for everything else.
 */
export function useAnnounce(
  message: string | null | undefined,
  politeness: Politeness = 'polite',
): void {
  const announce = useContext(AnnounceContext);
  const text = message ?? '';

  useEffect(() => {
    if (text !== '') {
      announce(text, politeness);
    }
  }, [announce, text, politeness]);
}

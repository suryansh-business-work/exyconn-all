import { useEffect, useState } from 'react';

/**
 * Opens the palette on the shortcut everybody already knows: Cmd+K on a Mac, Ctrl+K
 * elsewhere.
 *
 * Bound on the document rather than on a field, because the whole point is that it works
 * from anywhere in the portal. Typing in a text box is not excluded: Cmd+K is not a
 * character, and browsers reserve Ctrl+K for the address bar only when nothing takes it.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((was) => !was);
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, []);

  return { open, setOpen };
}

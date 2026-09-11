import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/** iOS announces the keyboard before it moves; Android only once it has. */
const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/** Whether the on-screen keyboard is up. */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener(SHOW, () => setOpen(true));
    const hidden = Keyboard.addListener(HIDE, () => setOpen(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  return open;
}

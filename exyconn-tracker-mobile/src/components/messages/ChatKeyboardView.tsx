import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';

interface Props {
  children: ReactNode;
}

/**
 * Keeps the composer above the keyboard on both platforms.
 *
 * React Native's KeyboardAvoidingView measures itself against its PARENT, so under the app
 * header it underestimates the overlap by exactly the header's height. Measuring where this
 * view actually sits on screen and handing that over as the offset makes the sum come out as
 * "bottom of this view minus top of the keyboard" — zero when the OS has already resized the
 * window, the keyboard's height when it has not.
 */
export function ChatKeyboardView({ children }: Readonly<Props>) {
  const frame = useRef<View>(null);
  const [offset, setOffset] = useState(0);

  return (
    <View
      ref={frame}
      style={{ flex: 1 }}
      onLayout={() => frame.current?.measureInWindow((_x, y) => setOffset(y))}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={offset}>
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

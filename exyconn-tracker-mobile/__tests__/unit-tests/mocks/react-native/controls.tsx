import { useEffect, useImperativeHandle, type ReactNode, type Ref } from 'react';
import { vi } from 'vitest';
import { domA11yProps } from './host-props';
import { useHostRef, type HostProps } from './host';

interface PressState {
  pressed: boolean;
  hovered: boolean;
  focused: boolean;
}

interface PressableProps extends Omit<HostProps, 'children'> {
  children?: ReactNode | ((state: PressState) => ReactNode);
  disabled?: boolean | null;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const IDLE: PressState = { pressed: false, hovered: false, focused: false };

/**
 * Click is `onPress`; the context-menu event (`fireEvent.contextMenu`) is `onLongPress`;
 * pointer down/up are `onPressIn`/`onPressOut`. A disabled pressable ignores all of them.
 */
export function Pressable({
  children,
  disabled,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  onFocus,
  onBlur,
  onLayout,
  ref,
  ...rest
}: Readonly<PressableProps>) {
  const hostRef = useHostRef(ref, onLayout);
  const off = disabled === true;
  const a11y = domA11yProps({
    ...rest,
    accessibilityState: { ...rest.accessibilityState, disabled: off || undefined },
  });
  return (
    <div
      ref={hostRef}
      tabIndex={0}
      {...a11y}
      onClick={off ? undefined : onPress}
      onContextMenu={off ? undefined : onLongPress}
      onPointerDown={off ? undefined : onPressIn}
      onPointerUp={off ? undefined : onPressOut}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {typeof children === 'function' ? children(IDLE) : children}
    </div>
  );
}

export const TouchableOpacity = Pressable;

export function ActivityIndicator(props: Readonly<HostProps & { size?: unknown; color?: string }>) {
  return <div role="progressbar" {...domA11yProps(props)} />;
}

export function Image({
  source,
  ...rest
}: Readonly<HostProps & { source?: { uri?: string } | number; resizeMode?: string }>) {
  const src = typeof source === 'object' ? source.uri : undefined;
  return <img src={src} alt={rest.accessibilityLabel ?? ''} {...domA11yProps(rest)} />;
}

/** A button standing in for pull-to-refresh: click it to "pull". */
export function RefreshControl({
  refreshing,
  onRefresh,
}: Readonly<{ refreshing: boolean; onRefresh?: () => void }>) {
  return (
    <button type="button" aria-label="Refresh" aria-busy={refreshing} onClick={onRefresh}>
      Refresh
    </button>
  );
}

interface TextInputProps extends HostProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  editable?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function TextInput({
  value,
  defaultValue,
  placeholder,
  editable,
  secureTextEntry,
  onChangeText,
  onSubmitEditing,
  onBlur,
  onFocus,
  ...rest
}: Readonly<TextInputProps>) {
  return (
    <input
      type={secureTextEntry ? 'password' : 'text'}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      readOnly={editable === false}
      onChange={(event) => onChangeText?.(event.target.value)}
      onKeyDown={(event) => event.key === 'Enter' && onSubmitEditing?.()}
      onBlur={onBlur}
      onFocus={onFocus}
      {...domA11yProps(rest)}
    />
  );
}

interface ScrollHandle {
  scrollTo: (options?: unknown) => void;
  scrollToEnd: (options?: unknown) => void;
}

interface ScrollViewProps extends Omit<HostProps, 'ref'> {
  refreshControl?: ReactNode;
  ref?: Ref<ScrollHandle>;
  contentContainerStyle?: unknown;
  keyboardShouldPersistTaps?: string;
  horizontal?: boolean;
}

export function ScrollView({ children, refreshControl, ref, ...rest }: Readonly<ScrollViewProps>) {
  useImperativeHandle(ref, () => ({ scrollTo: vi.fn(), scrollToEnd: vi.fn() }), []);
  return (
    <div {...domA11yProps(rest)}>
      {refreshControl}
      {children}
    </div>
  );
}

interface ModalProps {
  visible?: boolean;
  children?: ReactNode;
  onRequestClose?: () => void;
  onShow?: () => void;
  animationType?: string;
  transparent?: boolean;
  supportedOrientations?: string[];
}

/** Renders its content only while visible; Escape is the hardware back button. */
export function Modal({ visible = true, children, onRequestClose, onShow }: Readonly<ModalProps>) {
  useEffect(() => {
    if (visible) {
      onShow?.();
    }
  }, [visible, onShow]);
  if (!visible) {
    return null;
  }
  return (
    <div data-testid="rn-modal" onKeyDown={(event) => event.key === 'Escape' && onRequestClose?.()}>
      {children}
    </div>
  );
}

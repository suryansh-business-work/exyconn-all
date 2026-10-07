/**
 * Translates React Native accessibility and test props into their DOM equivalents, so a test
 * finds a native element the way a screen reader would: by role and label.
 */

interface AccessibilityState {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  expanded?: boolean;
  busy?: boolean;
}

export interface NativeHostProps {
  testID?: string;
  nativeID?: string;
  role?: string;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityElementsHidden?: boolean;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  importantForAccessibility?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

/** RN role names that differ from ARIA's. */
const ROLE_MAP: Record<string, string> = {
  adjustable: 'slider',
  header: 'heading',
  image: 'img',
  imagebutton: 'button',
  none: 'presentation',
  summary: 'region',
  text: 'paragraph',
  togglebutton: 'button',
};

function ariaRole(role: string | undefined): string | undefined {
  if (role === undefined) {
    return undefined;
  }
  return ROLE_MAP[role] ?? role;
}

function isHidden(props: Readonly<NativeHostProps>): boolean | undefined {
  const hidden =
    props['aria-hidden'] === true ||
    props.accessibilityElementsHidden === true ||
    props.importantForAccessibility === 'no-hide-descendants';
  return hidden || undefined;
}

function liveRegion(props: Readonly<NativeHostProps>): string | undefined {
  const live = props['aria-live'] ?? props.accessibilityLiveRegion;
  return live === 'none' ? 'off' : live;
}

/** The DOM attributes for a native host element's accessibility and test props. */
export function domA11yProps(props: Readonly<NativeHostProps>): Record<string, unknown> {
  const state = props.accessibilityState ?? {};
  return {
    'data-testid': props.testID,
    id: props.nativeID,
    role: ariaRole(props.role ?? props.accessibilityRole),
    'aria-label': props['aria-label'] ?? props.accessibilityLabel,
    'aria-description': props.accessibilityHint,
    'aria-disabled': state.disabled,
    'aria-selected': state.selected,
    'aria-checked': state.checked,
    'aria-expanded': state.expanded,
    'aria-busy': state.busy,
    'aria-hidden': isHidden(props),
    'aria-live': liveRegion(props),
  };
}

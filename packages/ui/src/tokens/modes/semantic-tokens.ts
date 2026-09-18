import type { ShadowScale } from '../box-shadow.token';

/**
 * The contract every mode fills in — shadcn/ui's roles, in MUI's vocabulary.
 *
 * These are ROLES, not colours: a component asks for `text.secondary`, and light and dark
 * each answer with whatever value reads correctly on their own ground. Adding a role here
 * means both modes must answer it — which is the point, and is what stops a screen from
 * being designed in one mode and discovered in the other.
 *
 * | shadcn/ui              | here                |
 * | ---------------------- | ------------------- |
 * | background / card      | background.page / .panel |
 * | muted, accent, secondary (surfaces) | background.muted |
 * | sidebar                | background.sidebar  |
 * | foreground / muted-foreground | text.primary / .secondary |
 * | primary / primary-foreground  | primary / onPrimary |
 * | destructive            | error               |
 * | border                 | divider             |
 * | input                  | control             |
 * | ring                   | ring                |
 */
export interface SemanticTokens {
  /** The accent worn by every primary button and every checked control. */
  primary: string;
  /** Ink on a primary button. */
  onPrimary: string;
  /** The brand accent — identity, never state (shadcn's grey `secondary` is `background.muted`). */
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: {
    /** The page itself. */
    page: string;
    /** Cards, panels, popovers. */
    panel: string;
    /** The quiet surface: a hovered row, the current nav row, the tab track, a neutral chip. */
    muted: string;
    /** The navigation drawer. */
    sidebar: string;
  };
  text: {
    primary: string;
    /** Must read at 4.5:1 on every background above, `muted` included. */
    secondary: string;
  };
  /** Hairline colour. Every decorative border in the system is this. */
  divider: string;
  /**
   * The edge of a control — a text field's outline, an unchecked switch's track. Held to 3:1 on
   * page, panel and sidebar (SC 1.4.11): it is the only thing that shows where the control is.
   */
  control: string;
  /** The keyboard focus ring. */
  ring: string;
  shadow: ShadowScale;
}

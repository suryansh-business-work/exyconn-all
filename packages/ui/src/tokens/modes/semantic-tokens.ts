/**
 * The contract every mode fills in.
 *
 * These are ROLES, not colours: a component asks for `text.secondary`, and light and dark
 * each answer with whatever value reads correctly on their own ground. Adding a role here
 * means both modes must answer it — which is the point, and is what stops a screen from
 * being designed in one mode and discovered in the other.
 */
export interface SemanticTokens {
  /** The accent worn by every primary button and every selected row. */
  primary: string;
  /**
   * Ink on a primary button. Dark mode inks it DARK: white on its lighter indigo reaches
   * only 3:1, and a button nobody can read is worse than no button.
   */
  onPrimary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: {
    /** The page itself. */
    page: string;
    /** Cards, panels, popovers. */
    panel: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  /** Hairline colour. Every border in the system is this, at `borderWidth.hairline`. */
  divider: string;
  shadow: {
    sm: string;
    md: string;
  };
}

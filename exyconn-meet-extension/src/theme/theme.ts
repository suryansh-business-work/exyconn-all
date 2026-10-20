import { createAppTheme, createTheme, type Theme } from '@exyconn/ui';

export type ColorScheme = 'light' | 'dark';

/**
 * The Exyconn theme for an extension surface. Inside Meet the app lives in a shadow root, so
 * every MUI portal (dialogs, menus, popovers, tooltips) is pointed at a node inside it —
 * otherwise they would render into Meet's document, outside the extension's styles.
 */
export function extensionTheme(scheme: ColorScheme, portalContainer?: HTMLElement): Theme {
  const base = createAppTheme(scheme);
  if (portalContainer === undefined) {
    return base;
  }
  const container = { defaultProps: { container: portalContainer } };
  return createTheme(base, {
    components: {
      MuiModal: container,
      MuiDialog: container,
      MuiPopover: container,
      MuiPopper: container,
      MuiMenu: container,
      MuiTooltip: { defaultProps: { slotProps: { popper: { container: portalContainer } } } },
    },
  });
}

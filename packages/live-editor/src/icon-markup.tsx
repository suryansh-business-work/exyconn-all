import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/** GrapesJS takes block and panel icons as markup, so an MUI icon is rendered to a string. */
export const iconMarkup = (Icon: ComponentType<{ style?: object }>, size = 28): string =>
  renderToStaticMarkup(<Icon style={{ width: size, height: size }} />);

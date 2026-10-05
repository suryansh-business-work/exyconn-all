import { baseCss } from './base';
import { contentCss } from './content';

/** The widget's whole stylesheet, with the theme's custom properties on :host. */
export function buildStyles(themeDeclarations: string): string {
  return [':host {', themeDeclarations, '}', baseCss, contentCss].join('\n');
}

/**
 * The tint behind each `accent` name a demo or illustration may use (`ACCENT_KEYS` in
 * @exyconn/wa-flow), for light and dark mode. Shared by every chat skin — the WhatsApp demo
 * and the website chat widget — so a business looks the same on both.
 */
import type { AccentKey } from '@exyconn/wa-flow';

export const LIGHT_ACCENTS: Readonly<Record<AccentKey, string>> = {
  teal: '#06a88a',
  green: '#25a244',
  blue: '#2b7de9',
  indigo: '#5b5fc7',
  purple: '#8e5bd6',
  pink: '#d6458b',
  red: '#e0473a',
  orange: '#ec7a1c',
  amber: '#c98a00',
  cyan: '#0a9dc0',
  slate: '#54656f',
  brown: '#8d6748',
};

export const DARK_ACCENTS: Readonly<Record<AccentKey, string>> = {
  teal: '#21c7a8',
  green: '#4cc768',
  blue: '#5aa2f5',
  indigo: '#8c90f0',
  purple: '#b48cf0',
  pink: '#f07ab3',
  red: '#f47d72',
  orange: '#f59d55',
  amber: '#f0bd3d',
  cyan: '#3ec4e4',
  slate: '#aebac1',
  brown: '#c49a78',
};

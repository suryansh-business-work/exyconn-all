/**
 * The WhatsApp skin's design tokens — the one place this app's colours, sizes, radii and type
 * live. They sit in the app, not in @exyconn/ui, because they describe somebody else's
 * product as a client will recognise it, and no other Exyconn surface should ever wear them.
 * Values are our own reading of the familiar look; no WhatsApp asset is used.
 */
import type { AccentKey } from '@exyconn/wa-flow';

export interface WaPalette {
  appBackdrop: string;
  appStripe: string;
  panel: string;
  panelHeader: string;
  rowHover: string;
  rowSelected: string;
  divider: string;
  text: string;
  textMuted: string;
  icon: string;
  brand: string;
  brandBar: string;
  onBrandBar: string;
  badge: string;
  onBadge: string;
  chatBackground: string;
  doodle: string;
  bubbleIn: string;
  bubbleOut: string;
  bubbleMeta: string;
  bubbleMetaOut: string;
  quote: string;
  quoteBar: string;
  tickRead: string;
  tickGrey: string;
  chip: string;
  chipText: string;
  notice: string;
  noticeText: string;
  composer: string;
  input: string;
  link: string;
  danger: string;
  verified: string;
  onVerified: string;
  card: string;
  mapLand: string;
  mapRoad: string;
  mapWater: string;
  pin: string;
  overlay: string;
  qrInk: string;
  qrPaper: string;
  accents: Readonly<Record<AccentKey, string>>;
}

const LIGHT_ACCENTS: Readonly<Record<AccentKey, string>> = {
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

const DARK_ACCENTS: Readonly<Record<AccentKey, string>> = {
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

export const WA_LIGHT: WaPalette = {
  appBackdrop: '#eae6df',
  appStripe: '#00a884',
  panel: '#ffffff',
  panelHeader: '#f0f2f5',
  rowHover: '#f5f6f6',
  rowSelected: '#f0f2f5',
  divider: '#e9edef',
  text: '#111b21',
  textMuted: '#667781',
  icon: '#54656f',
  brand: '#008069',
  brandBar: '#008069',
  onBrandBar: '#ffffff',
  badge: '#25d366',
  onBadge: '#ffffff',
  chatBackground: '#efeae2',
  doodle: '#e2dbcf',
  bubbleIn: '#ffffff',
  bubbleOut: '#d9fdd3',
  bubbleMeta: '#667781',
  bubbleMetaOut: '#667781',
  quote: '#0000000d',
  quoteBar: '#06cf9c',
  tickRead: '#53bdeb',
  tickGrey: '#8696a0',
  chip: '#ffffff',
  chipText: '#54656f',
  notice: '#ffeecd',
  noticeText: '#54656f',
  composer: '#f0f2f5',
  input: '#ffffff',
  link: '#027eb5',
  danger: '#ea0038',
  verified: '#00a884',
  onVerified: '#ffffff',
  card: '#f7f8fa',
  mapLand: '#e8eadf',
  mapRoad: '#ffffff',
  mapWater: '#aadaff',
  pin: '#ea4335',
  overlay: '#0b141a99',
  qrInk: '#111b21',
  qrPaper: '#ffffff',
  accents: LIGHT_ACCENTS,
};

export const WA_DARK: WaPalette = {
  appBackdrop: '#0c1317',
  appStripe: '#00a884',
  panel: '#111b21',
  panelHeader: '#202c33',
  rowHover: '#202c33',
  rowSelected: '#2a3942',
  divider: '#222d34',
  text: '#e9edef',
  textMuted: '#8696a0',
  icon: '#aebac1',
  brand: '#00a884',
  brandBar: '#202c33',
  onBrandBar: '#e9edef',
  badge: '#00a884',
  onBadge: '#111b21',
  chatBackground: '#0b141a',
  doodle: '#141d23',
  bubbleIn: '#202c33',
  bubbleOut: '#005c4b',
  bubbleMeta: '#8696a0',
  bubbleMetaOut: '#c6d6cf',
  quote: '#ffffff12',
  quoteBar: '#06cf9c',
  tickRead: '#53bdeb',
  tickGrey: '#8696a0',
  chip: '#182229',
  chipText: '#8696a0',
  notice: '#182229',
  noticeText: '#ffd279',
  composer: '#202c33',
  input: '#2a3942',
  link: '#53bdeb',
  danger: '#f15c6d',
  verified: '#00a884',
  onVerified: '#111b21',
  card: '#1a252c',
  mapLand: '#1f2b24',
  mapRoad: '#3b4a52',
  mapWater: '#16384d',
  pin: '#f47d72',
  overlay: '#000000b3',
  qrInk: '#111b21',
  qrPaper: '#ffffff',
  accents: DARK_ACCENTS,
};

/** Type — the system UI stack WhatsApp's own clients render with. */
export const WA_FONT = {
  family:
    '"Segoe UI", "Helvetica Neue", Helvetica, "Lucida Grande", Arial, Ubuntu, Cantarell, "Fira Sans", sans-serif',
  message: '14.2px',
  messageLine: '19px',
  name: '17px',
  nameCompact: '16px',
  preview: '14px',
  meta: '11px',
  small: '12.5px',
  title: '16px',
  heading: '19px',
  emoji: '20px',
  hero: '32px',
} as const;

/** Spacing, in pixels as the familiar layout measures them. */
export const WA_SPACE = {
  hair: '2px',
  xxs: '4px',
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  /** Side gutter of the message column on a wide screen. */
  gutter: '63px',
  gutterCompact: '12px',
} as const;

export const WA_RADIUS = {
  bubble: '7.5px',
  chip: '7.5px',
  input: '8px',
  card: '6px',
  pill: '999px',
  sheet: '16px',
} as const;

export const WA_SIZE = {
  header: '59px',
  headerCompact: '56px',
  row: '72px',
  avatar: '49px',
  avatarHeader: '40px',
  avatarLarge: '200px',
  iconButton: '40px',
  listWidth: '30%',
  listMin: '340px',
  listMax: '420px',
  appMaxWidth: '1600px',
  appInset: '19px',
  bubbleMax: '65%',
  bubbleMaxCompact: '85%',
  card: '300px',
  carouselCard: '232px',
  media: '330px',
  mediaHeight: '220px',
  qr: '168px',
  map: '150px',
  /** Room kept at the end of a bubble's last line for its time (and ticks). */
  metaSpace: '58px',
  metaSpaceOut: '78px',
  tail: '8px',
  tailHeight: '13px',
  badge: '20px',
  heroIcon: '120px',
  heroText: '460px',
  typingDot: '7px',
  /** Rendered size of one wallpaper doodle tile. */
  doodle: '190px',
  stripe: '127px',
} as const;

export const WA_SHADOW = {
  bubble: '0 1px 0.5px #0b141a21',
  sheet: '0 -2px 12px #0b141a29',
  toast: '0 6px 18px #0b141a3d',
} as const;

export const WA_MOTION = {
  /** sent → delivered → read, as the ticks animate. */
  deliveredMs: 350,
  readMs: 650,
  fast: '120ms',
  normal: '200ms',
} as const;

/** Line weights: dividers, focus rings, the quote bar. */
export const WA_LINE = {
  hair: '1px',
  focus: '2px',
  quote: '4px',
  stripe: '6px',
} as const;

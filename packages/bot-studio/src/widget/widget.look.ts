import { readableAccent, readableInk, useTheme } from '@exyconn/shell/components/ui';
import type { AccentKey } from '@exyconn/wa-flow';
import { DARK_ACCENTS, LIGHT_ACCENTS } from '../shared/accents';

/** A business's accent in the widget: its fill, the ink on it, and the accent as readable text. */
export interface WidgetLook {
  fill: string;
  onFill: string;
  text: string;
}

export function useWidgetLook(accent: AccentKey): WidgetLook {
  const theme = useTheme();
  const fill = (theme.palette.mode === 'dark' ? DARK_ACCENTS : LIGHT_ACCENTS)[accent];
  return { fill, onFill: readableInk(fill), text: readableAccent(fill, theme) };
}

import { SizableText, type SizableTextProps } from 'tamagui';

/**
 * The app's few kinds of text. Named for what they are, not how big they are, so a screen reads
 * as structure: the page's big title, a title, a heading inside a panel, body copy, and the
 * quieter caption under it.
 */
export function Display(props: Readonly<SizableTextProps>) {
  return (
    <SizableText
      size="$9"
      fontWeight="700"
      letterSpacing={-0.5}
      color="$ink"
      accessibilityRole="header"
      {...props}
    />
  );
}

/** A big figure — a day's hours, a period's total — with digits that do not jitter. */
export function Figure(props: Readonly<SizableTextProps>) {
  return (
    <SizableText
      size="$10"
      fontWeight="700"
      letterSpacing={-1}
      color="$ink"
      fontVariant={['tabular-nums']}
      {...props}
    />
  );
}

export function Title(props: Readonly<SizableTextProps>) {
  return (
    <SizableText size="$7" fontWeight="700" color="$ink" accessibilityRole="header" {...props} />
  );
}

export function Heading(props: Readonly<SizableTextProps>) {
  return (
    <SizableText size="$5" fontWeight="600" color="$ink" accessibilityRole="header" {...props} />
  );
}

export function Body(props: Readonly<SizableTextProps>) {
  return <SizableText size="$4" color="$ink" {...props} />;
}

export function Caption(props: Readonly<SizableTextProps>) {
  return <SizableText size="$3" color="$muted" {...props} />;
}

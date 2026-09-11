import { SizableText, type SizableTextProps } from 'tamagui';

/**
 * The app's few kinds of text. Named for what they are, not how big they are, so a screen reads
 * as structure: a title, a heading inside a panel, body copy, and the quieter caption under it.
 */
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

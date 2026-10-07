/** `@expo/vector-icons/*`: an element naming the glyph, with RN's accessibility props. */
interface Props {
  name: string;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: string;
}

export default function VectorIcon({
  name,
  size,
  color,
  accessibilityLabel,
  accessibilityElementsHidden,
}: Readonly<Props>) {
  return (
    <span
      data-testid={`icon-${name}`}
      data-size={size}
      data-color={color}
      role={accessibilityLabel === undefined ? undefined : 'img'}
      aria-label={accessibilityLabel}
      aria-hidden={accessibilityElementsHidden || undefined}
    />
  );
}

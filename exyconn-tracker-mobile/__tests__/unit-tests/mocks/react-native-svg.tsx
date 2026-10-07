import { createElement, type ReactNode } from 'react';

/**
 * `react-native-svg`: each shape is the DOM SVG element of the same name, so a test can read a
 * chart's geometry (`container.querySelectorAll('rect')`, their `width`, `fill`, …).
 */
interface SvgProps {
  children?: ReactNode;
  accessibilityLabel?: string;
  accessible?: boolean;
  testID?: string;
  style?: unknown;
  [attribute: string]: unknown;
}

function svgElement(tag: string) {
  function SvgElement({
    children,
    accessibilityLabel,
    accessible,
    testID,
    style: _style,
    ...attributes
  }: Readonly<SvgProps>) {
    const a11y = {
      'aria-label': accessibilityLabel,
      'aria-hidden': accessible === false || undefined,
      'data-testid': testID,
    };
    return createElement(tag, { ...attributes, ...a11y }, children);
  }
  SvgElement.displayName = `Svg.${tag}`;
  return SvgElement;
}

const Svg = svgElement('svg');
export default Svg;
export const Circle = svgElement('circle');
export const Defs = svgElement('defs');
export const G = svgElement('g');
export const Line = svgElement('line');
export const LinearGradient = svgElement('linearGradient');
export const Path = svgElement('path');
export const Rect = svgElement('rect');
export const Stop = svgElement('stop');
export const Text = svgElement('text');

import { boxShadow, color, radius } from '@exyconn/ui';
import { COMPONENT_TAG, FRAGMENT_TAG } from '@exyconn/cms';

const ink = color.neutral[800];
const muted = color.neutral[500];
const line = color.neutral[100];
const surface = color.neutral[0];
const containerTint = color.neutral[50];
const componentAccent = color.blue[400];
const fragmentAccent = color.violet[300];

/**
 * How placeholders look on the canvas: a card per section, its name in bold and what it says
 * underneath (the website renders the real section — see the live preview beside the canvas).
 * The name and summary are attributes of the canvas element only, drawn by pseudo-elements,
 * so nothing of the card reaches the saved HTML or can be typed into. Cards are flex columns
 * so a container's own heading stays above the sections dropped into it.
 */
export const PLACEHOLDER_CSS = String.raw`
${COMPONENT_TAG}, ${FRAGMENT_TAG} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 12px 0;
  padding: 14px 16px;
  min-height: 56px;
  box-sizing: border-box;
  border: 1px solid ${line};
  border-left: 4px solid ${componentAccent};
  border-radius: ${radius.md}px;
  background: ${surface};
  box-shadow: ${boxShadow.light.sm};
  font: 13px/1.5 "Inter Tight", system-ui, sans-serif;
  color: ${muted};
}
${FRAGMENT_TAG} { border-left-color: ${fragmentAccent}; }
${COMPONENT_TAG}::before, ${FRAGMENT_TAG}::before {
  order: -2;
  content: attr(data-exy-title);
  font-size: 14px;
  font-weight: 600;
  color: ${ink};
}
${COMPONENT_TAG}::after, ${FRAGMENT_TAG}::after {
  order: -1;
  content: attr(data-exy-summary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
${COMPONENT_TAG}[data-exy-container] {
  padding-bottom: 8px;
  background: ${containerTint};
}
${COMPONENT_TAG}[data-exy-container]:empty::after {
  content: attr(data-exy-summary) "\A\A" "Drop blocks here";
}
${COMPONENT_TAG}[data-exy-container] > ${COMPONENT_TAG}, ${COMPONENT_TAG}[data-exy-container] > ${FRAGMENT_TAG} {
  margin: 8px 0;
}
${COMPONENT_TAG}[data-exy-container] > :not(${COMPONENT_TAG}):not(${FRAGMENT_TAG}) { color: initial; font: initial; }
`;

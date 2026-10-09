import { color } from '@exyconn/ui';
import { COMPONENT_TAG, FRAGMENT_TAG } from '@exyconn/cms';

const ink = color.neutral[800];
const muted = color.neutral[500];
const componentLine = color.blue[400];
const componentTint = color.neutral[50];
const fragmentLine = color.violet[300];

/**
 * How placeholders look on the canvas: a dashed, labelled card (the website renders the real
 * section). The label and summary are attributes of the canvas element only, drawn by a
 * pseudo-element, so nothing of the card reaches the saved HTML or can be typed into.
 */
export const PLACEHOLDER_CSS = String.raw`
${COMPONENT_TAG}, ${FRAGMENT_TAG} {
  display: block;
  margin: 8px 0;
  padding: 12px 16px;
  min-height: 48px;
  border: 2px dashed ${componentLine};
  border-radius: 8px;
  background: ${componentTint};
  font: 13px/1.45 system-ui, sans-serif;
  color: ${muted};
}
${FRAGMENT_TAG} { border-color: ${fragmentLine}; }
${COMPONENT_TAG}::before, ${FRAGMENT_TAG}::before {
  content: attr(data-exy-title) "\A" attr(data-exy-summary);
  display: block;
  white-space: pre-wrap;
  color: ${ink};
}
${COMPONENT_TAG}[data-exy-container] { padding-bottom: 24px; }
${COMPONENT_TAG}[data-exy-container]:empty::after {
  content: "Drop blocks here";
  display: block;
  margin-top: 8px;
  color: ${muted};
}
${COMPONENT_TAG}[data-exy-container] > :not(${COMPONENT_TAG}):not(${FRAGMENT_TAG}) { color: initial; font: initial; }
`;

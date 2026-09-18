import type { OrgTreeNode } from './org-tree';

/** Card size and spacing of the chart, in React Flow units. */
export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 72;
const SIBLING_GAP = 24;
const LEVEL_GAP = 64;

export interface PlacedPerson {
  node: OrgTreeNode;
  /** Top-left corner of the card. */
  x: number;
  y: number;
}

export interface ReportingLink {
  managerId: string;
  reportId: string;
}

export interface OrgLayout {
  placed: PlacedPerson[];
  links: ReportingLink[];
}

/** Width a person and everyone under them needs, so no two teams overlap. */
function subtreeWidth(node: OrgTreeNode, widths: Map<string, number>): number {
  const children = node.reports.reduce(
    (total, report, index) => total + subtreeWidth(report, widths) + (index ? SIBLING_GAP : 0),
    0,
  );
  const width = Math.max(NODE_WIDTH, children);
  widths.set(node.id, width);
  return width;
}

/** Places a person centred over their team, then each report's team left to right. */
function place(
  node: OrgTreeNode,
  left: number,
  depth: number,
  widths: Map<string, number>,
  out: OrgLayout,
): void {
  const width = widths.get(node.id) ?? NODE_WIDTH;
  out.placed.push({
    node,
    x: left + (width - NODE_WIDTH) / 2,
    y: depth * (NODE_HEIGHT + LEVEL_GAP),
  });
  const childrenWidth = node.reports.reduce(
    (total, report, index) => total + (widths.get(report.id) ?? 0) + (index ? SIBLING_GAP : 0),
    0,
  );
  let cursor = left + (width - childrenWidth) / 2;
  for (const report of node.reports) {
    out.links.push({ managerId: node.id, reportId: report.id });
    place(report, cursor, depth + 1, widths, out);
    cursor += (widths.get(report.id) ?? 0) + SIBLING_GAP;
  }
}

/**
 * A top-down tidy layout of the reporting lines: each manager centred over their reports,
 * separate trees side by side. Pure, so the chart and its tests read the same positions.
 */
export function layoutOrgForest(roots: OrgTreeNode[]): OrgLayout {
  const widths = new Map<string, number>();
  const out: OrgLayout = { placed: [], links: [] };
  let left = 0;
  for (const root of roots) {
    const width = subtreeWidth(root, widths);
    place(root, left, 0, widths, out);
    left += width + SIBLING_GAP * 2;
  }
  return out;
}

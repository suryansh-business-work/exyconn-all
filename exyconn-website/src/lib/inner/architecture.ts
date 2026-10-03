/**
 * Lays out ArchitectureDiagram's SVG: one band per layer, top to bottom, with its nodes in
 * rows of at most three. The viewBox is narrow (360 wide) so the labels stay legible when a
 * phone scales it down; the component caps it at 32rem on wide screens.
 */
export interface ArchitectureLayer {
  /** Mono label above the band, e.g. "Channels". */
  label: string;
  /** Node captions in the band. Keep them short (≤ 18 characters). */
  nodes: readonly string[];
}

export interface PlacedNode {
  key: string;
  text: string;
  x: number;
  y: number;
  width: number;
}

export interface PlacedLayer {
  key: string;
  label: string;
  labelY: number;
  top: number;
  bottom: number;
  nodes: PlacedNode[];
}

export const VIEW_WIDTH = 360;
export const NODE_HEIGHT = 36;
const PAD = 8;
const PER_ROW = 3;
const ROW_GAP = 8;
const LABEL_SPACE = 22;
const LAYER_GAP = 30;

export const layoutArchitecture = (
  layers: readonly ArchitectureLayer[]
): { layers: PlacedLayer[]; height: number } => {
  let y = PAD;
  const placed = layers.map((layer, layerIndex) => {
    const labelY = y + 12;
    const top = y + LABEL_SPACE;
    const nodes = layer.nodes.map((text, index) => {
      const row = Math.floor(index / PER_ROW);
      const inRow = Math.min(PER_ROW, layer.nodes.length - row * PER_ROW);
      const width = (VIEW_WIDTH - PAD * 2 - (inRow - 1) * ROW_GAP) / inRow;
      return {
        key: `${layerIndex}-${index}`,
        text,
        x: PAD + (index % PER_ROW) * (width + ROW_GAP),
        y: top + row * (NODE_HEIGHT + ROW_GAP),
        width,
      };
    });
    const rows = Math.max(1, Math.ceil(layer.nodes.length / PER_ROW));
    const bottom = top + rows * NODE_HEIGHT + (rows - 1) * ROW_GAP;
    y = bottom + LAYER_GAP;
    return { key: `${layerIndex}-${layer.label}`, label: layer.label, labelY, top, bottom, nodes };
  });
  return { layers: placed, height: y - LAYER_GAP + PAD };
};

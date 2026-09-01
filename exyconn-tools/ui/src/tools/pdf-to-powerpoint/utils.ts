// Pure math for placing a rendered PDF page onto a PowerPoint slide.

export interface SlideBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 16:9 slide dimensions in inches (pptxgenjs LAYOUT_16x9). */
export const SLIDE_16X9 = { w: 10, h: 5.625 } as const;

/** Contain-fits a source rectangle into a box, centered, preserving aspect ratio. */
export const fitContain = (srcW: number, srcH: number, boxW: number, boxH: number): SlideBox => {
  if (srcW <= 0 || srcH <= 0) {
    return { x: 0, y: 0, w: boxW, h: boxH };
  }
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
};

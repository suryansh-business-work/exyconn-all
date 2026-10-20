import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { Box } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { PANEL_WIDTH, clampPanelWidth } from '../../storage/layout';

/** One arrow-key press resizes the panel by this much. */
const KEY_STEP = 16;

interface Props {
  width: number;
  onResize: (width: number) => void;
  onCommit: (width: number) => void;
}

/** The panel's right edge, a width slider: drag it, or focus it and use the arrow keys. */
export function PanelResizeHandle({ width, onResize, onCommit }: Readonly<Props>) {
  const t = useT();
  const start = useRef<{ x: number; width: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX, width };
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>): void => {
    if (start.current !== null) {
      onResize(clampPanelWidth(start.current.width + event.clientX - start.current.x));
    }
  };
  const onPointerUp = (): void => {
    if (start.current !== null) {
      start.current = null;
      onCommit(width);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    const delta = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      const next = clampPanelWidth(width + delta);
      onResize(next);
      onCommit(next);
    }
  };

  return (
    <Box
      role="slider"
      aria-orientation="horizontal"
      aria-label={t('Panel width')}
      aria-valuenow={width}
      aria-valuemin={PANEL_WIDTH.min}
      aria-valuemax={PANEL_WIDTH.max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 8,
        cursor: 'ew-resize',
        touchAction: 'none',
        '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main' },
      }}
    />
  );
}

import type { PointerEvent } from 'react';
import { Box, Text, TextField } from '@exyconn/shell/components/ui';
import { HIGHLIGHT, type PdfAnnotation } from './pdf-editor.types';

interface AnnotationViewProps {
  annotation: PdfAnnotation;
  selected: boolean;
  editing: boolean;
  /** Screen pixels per PDF point at the current zoom, so text renders at its printed size. */
  pointScale: number;
  onPointerDown: (event: PointerEvent<HTMLElement>, annotation: PdfAnnotation) => void;
  onTextChange: (id: string, text: string) => void;
  onTextDone: (annotation: PdfAnnotation) => void;
}

const pct = (value: number) => `${value * 100}%`;

/** A freehand stroke, drawn over the whole page in page fractions. */
function Stroke({
  annotation,
}: Readonly<{ annotation: Extract<PdfAnnotation, { kind: 'draw' }> }>) {
  return (
    <svg
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <polyline
        points={annotation.points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke={annotation.color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** What each kind looks like inside its box. */
function Body(props: Readonly<AnnotationViewProps>) {
  const { annotation: a, editing, pointScale } = props;
  if (a.kind === 'text') {
    const fontSize = a.fontSize * pointScale;
    if (editing) {
      return (
        <TextField
          variant="standard"
          multiline
          autoFocus
          fullWidth
          value={a.text}
          onChange={(event) => props.onTextChange(a.id, event.target.value)}
          onBlur={() => props.onTextDone(a)}
          slotProps={{
            htmlInput: { 'aria-label': 'Text on the page' },
            input: { sx: { fontSize, color: a.color, lineHeight: 1.2, p: 0 } },
          }}
        />
      );
    }
    return (
      <Text sx={{ fontSize, color: a.color, lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>
        {a.text}
      </Text>
    );
  }
  if (a.kind === 'image') {
    return <Box component="img" src={a.src} alt="" sx={{ width: '100%', height: '100%' }} />;
  }
  return null;
}

/** Background and border per kind; the box itself is the shape for rectangles and fills. */
function boxStyle(a: PdfAnnotation) {
  if (a.kind === 'rect') {
    return { border: `2px solid ${a.color}` };
  }
  if (a.kind === 'highlight') {
    return { bgcolor: HIGHLIGHT.color, opacity: HIGHLIGHT.opacity };
  }
  if (a.kind === 'whiteout') {
    return { bgcolor: 'common.white' };
  }
  return {};
}

/** One annotation on the page, positioned in page fractions and selectable. */
export function AnnotationView(props: Readonly<AnnotationViewProps>) {
  const { annotation: a, selected } = props;
  if (a.kind === 'draw') {
    return <Stroke annotation={a} />;
  }
  return (
    <Box
      data-annotation={a.kind}
      onPointerDown={(event) => props.onPointerDown(event, a)}
      sx={{
        position: 'absolute',
        left: pct(a.x),
        top: pct(a.y),
        width: pct(a.w),
        minHeight: a.kind === 'text' ? undefined : pct(a.h),
        height: a.kind === 'text' ? 'auto' : pct(a.h),
        cursor: 'move',
        outline: selected ? 2 : 0,
        outlineStyle: 'dashed',
        outlineColor: 'primary.main',
        outlineOffset: 2,
        ...boxStyle(a),
      }}
    >
      <Body {...props} />
    </Box>
  );
}

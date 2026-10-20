import { useEffect, useRef, useState } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { PDFDocumentProxy } from './pdfjs';
import { AnnotationView } from './AnnotationView';
import { HIGHLIGHT } from './pdf-editor.types';
import type { PdfAnnotationsApi } from './usePdfAnnotations';
import { useLayerGestures } from './useLayerGestures';

interface PdfPageProps {
  doc: PDFDocumentProxy;
  /** 0-based. */
  index: number;
  /** On-screen width of the page, in CSS pixels. */
  width: number;
  api: PdfAnnotationsApi;
  label: string;
}

const pct = (value: number) => `${value * 100}%`;

/** One page: pdf.js paints it on a canvas, and the annotations sit in a layer over it. */
export function PdfPage({ doc, index, width, api, label }: Readonly<PdfPageProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 612, height: 792 });
  const pageAspect = size.width / size.height;
  const gestures = useLayerGestures(api, index, pageAspect);
  const pointScale = width / size.width;

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const page = await doc.getPage(index + 1);
      const base = page.getViewport({ scale: 1 });
      const ratio = Math.max(globalThis.devicePixelRatio || 1, 1);
      const viewport = page.getViewport({ scale: (width / base.width) * ratio });
      const canvas = canvasRef.current;
      if (cancelled || !canvas) {
        return;
      }
      setSize({ width: base.width, height: base.height });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
    };
    render().catch((error: unknown) =>
      portalLogger.error('Legal: a PDF page failed to render', error),
    );
    return () => {
      cancelled = true;
    };
  }, [doc, index, width]);

  const onPage = api.annotations.filter((a) => a.page === index);
  const preview = gestures.preview;

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height: width / pageAspect,
        boxShadow: 2,
        bgcolor: 'common.white',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label={label}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <Box
        data-testid={`pdf-layer-${index}`}
        onPointerDown={gestures.onPointerDown}
        onPointerMove={gestures.onPointerMove}
        onPointerUp={gestures.onPointerUp}
        sx={{
          position: 'absolute',
          inset: 0,
          touchAction: 'none',
          cursor: api.tool === 'select' ? 'default' : 'crosshair',
        }}
      >
        {onPage.map((annotation) => (
          <AnnotationView
            key={annotation.id}
            annotation={annotation}
            selected={api.selectedId === annotation.id}
            editing={api.editingId === annotation.id}
            pointScale={pointScale}
            onPointerDown={gestures.onAnnotationDown}
            onTextChange={(id, text) => api.update(id, { text })}
            onTextDone={(a) => {
              api.setEditingId(null);
              if (a.kind === 'text' && !a.text.trim()) {
                api.remove(a.id);
              }
            }}
          />
        ))}
        {preview && preview.kind !== 'draw' && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: pct(preview.x),
              top: pct(preview.y),
              width: pct(preview.w),
              height: pct(preview.h),
              border: 1,
              borderStyle: 'dashed',
              borderColor: 'primary.main',
              bgcolor: preview.kind === 'highlight' ? HIGHLIGHT.color : undefined,
              opacity: preview.kind === 'highlight' ? HIGHLIGHT.opacity : 1,
            }}
          />
        )}
      </Box>
    </Box>
  );
}

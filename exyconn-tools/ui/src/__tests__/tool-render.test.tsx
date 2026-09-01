/**
 * The render matrix: every registered tool must mount under jsdom inside the
 * same provider stack the real app uses (src/App.tsx), and must show its own
 * registry name once mounted (ToolLayout renders it in the breadcrumb, and
 * ToolDetails renders it again in the "About <name>" heading).
 *
 * This is the smoke test that catches a tool that throws on first paint —
 * a broken import, a hook order violation, a null deref in initial state.
 */
import React, { Suspense } from 'react';
import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../shared/context/ThemeContext';
import { OpenAIProvider } from '../shared/context/OpenAIContext';
import { getAllTools } from '../shared/data/toolsData';

/* ------------------------------------------------------------------ *
 * Module mocks for libraries jsdom cannot execute.
 * Scoped to this file on purpose: the per-tool suites install their own,
 * sharper mocks and must not be affected by these.
 * ------------------------------------------------------------------ */

const stubComponent = (testId: string) => {
  const Stub: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
    React.createElement('div', { 'data-testid': testId }, children);
  Stub.displayName = testId;
  return Stub;
};

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  version: '5.4.624',
  PixelsPerInch: { PDF_TO_CSS_UNITS: 1 },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(() =>
        Promise.resolve({
          getViewport: () => ({ width: 100, height: 100, scale: 1 }),
          render: () => ({ promise: Promise.resolve() }),
          getTextContent: () => Promise.resolve({ items: [] }),
        }),
      ),
      destroy: vi.fn(),
    }),
    destroy: vi.fn(),
  })),
}));

vi.mock('tesseract.js', () => {
  const recognize = vi.fn(() => Promise.resolve({ data: { text: '' } }));
  return {
    default: { recognize, createWorker: vi.fn() },
    recognize,
    createWorker: vi.fn(() =>
      Promise.resolve({ recognize, terminate: vi.fn(), setParameters: vi.fn() }),
    ),
  };
});

vi.mock('html-to-image', () => ({
  toJpeg: vi.fn(() => Promise.resolve('data:image/jpeg;base64,mock')),
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,mock')),
  toSvg: vi.fn(() => Promise.resolve('data:image/svg+xml;base64,mock')),
  toBlob: vi.fn(() => Promise.resolve(new Blob())),
  toCanvas: vi.fn(() => Promise.resolve(document.createElement('canvas'))),
}));

vi.mock('qrcode', () => {
  const api = {
    toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,mock')),
    toCanvas: vi.fn(() => Promise.resolve(document.createElement('canvas'))),
    toString: vi.fn(() => Promise.resolve('<svg />')),
  };
  return { ...api, default: api };
});

vi.mock('react-pdf', () => ({
  Document: stubComponent('react-pdf-document'),
  Page: stubComponent('react-pdf-page'),
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' }, version: '5.4.624' },
}));

vi.mock('react-easy-crop', () => ({
  default: stubComponent('react-easy-crop'),
}));

vi.mock('react-quill-new', () => ({
  default: stubComponent('react-quill'),
}));

vi.mock('docx', () => ({
  Document: vi.fn(),
  Packer: { toBlob: vi.fn(() => Promise.resolve(new Blob())) },
  PageBreak: vi.fn(),
  Paragraph: vi.fn(),
  TextRun: vi.fn(),
  HeadingLevel: { HEADING_1: 'Heading1' },
  AlignmentType: { LEFT: 'left' },
}));

vi.mock('exceljs', () => ({
  Workbook: vi.fn(() => ({
    addWorksheet: vi.fn(() => ({ addRow: vi.fn(), columns: [] })),
    xlsx: { writeBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))) },
  })),
}));

vi.mock('pptxgenjs', () => ({
  default: vi.fn(() => ({
    addSlide: vi.fn(() => ({ addImage: vi.fn(), addText: vi.fn() })),
    defineLayout: vi.fn(),
    writeFile: vi.fn(() => Promise.resolve('deck.pptx')),
    write: vi.fn(() => Promise.resolve(new Blob())),
  })),
}));

vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: vi.fn(() => ({ isLoaded: false, loadError: undefined })),
  useLoadScript: vi.fn(() => ({ isLoaded: false, loadError: undefined })),
  GoogleMap: stubComponent('google-map'),
  Polygon: stubComponent('google-map-polygon'),
  Marker: stubComponent('google-map-marker'),
  InfoWindow: stubComponent('google-map-infowindow'),
  DrawingManager: stubComponent('google-map-drawing-manager'),
  Autocomplete: stubComponent('google-map-autocomplete'),
}));

/* ------------------------------------------------------------------ *
 * Tools that cannot be mounted under jsdom.
 * Keep this list as small as possible — each entry needs a reason.
 * ------------------------------------------------------------------ */
const SKIP: Record<string, string> = {};

/**
 * Same discovery mechanism the router uses (src/routes.tsx), so this matrix
 * covers exactly the modules that can become routes.
 */
const toolModules = import.meta.glob('../tools/*/index.tsx') as Record<
  string,
  () => Promise<{ default: React.ComponentType }>
>;

const cases = getAllTools().map((tool) => [tool.id, tool.name] as const);

const renderTool = async (id: string) => {
  const loader = toolModules[`../tools/${id}/index.tsx`];
  expect(loader, `no module found at src/tools/${id}/index.tsx`).toBeDefined();
  const module = await loader();
  const Tool = module.default;
  expect(Tool, `src/tools/${id}/index.tsx has no default export`).toBeDefined();

  render(
    <ThemeProvider>
      <OpenAIProvider>
        <MemoryRouter initialEntries={[`/tools/${id}`]}>
          <Suspense fallback={<div>loading</div>}>
            <Tool />
          </Suspense>
        </MemoryRouter>
      </OpenAIProvider>
    </ThemeProvider>,
  );
};

// Every tool renders a full page (AppBar + details + footer); the resulting
// React act()/prop warnings would bury the actual failures in CI output.
let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeAll(async () => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  // Vitest transforms modules on demand, so whichever tool renders first pays
  // for the whole shared MUI/ToolLayout graph (~15s). Warm it here instead, so
  // no single test in the matrix sits near its timeout on a slow CI runner.
  await import('../shared/components/ToolLayout/ToolLayout');
}, 120000);

afterAll(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

describe('tool render matrix', () => {
  test('covers every registered tool', () => {
    expect(cases).toHaveLength(getAllTools().length);
    expect(Object.keys(toolModules)).toHaveLength(getAllTools().length);
  });

  test.each(cases)(
    'renders %s',
    async (id, name) => {
      if (SKIP[id]) {
        return;
      }
      await renderTool(id);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      expect(document.body.textContent).toContain(name);
    },
    20000,
  );
});

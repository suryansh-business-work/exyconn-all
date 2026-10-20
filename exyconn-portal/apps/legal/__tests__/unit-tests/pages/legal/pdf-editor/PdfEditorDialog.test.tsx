import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PdfEditorDialog } from '../../../../../src/pages/legal/pdf-editor';
import { renderWithProviders } from '../../../test-utils';
import { LoadingImage, PAD_SIGNATURE, fakePdfDoc } from './pdf-editor.stubs';

const mocks = vi.hoisted(() => ({
  file: { bytes: null as Uint8Array | null, doc: null as unknown, error: null as string | null },
  apply: vi.fn(),
  upload: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../../../../../src/pages/legal/pdf-editor/usePdfFile', () => ({
  usePdfFile: (url: string | null) => (url ? mocks.file : { bytes: null, doc: null, error: null }),
}));
// Writing into a real PDF is covered by applyAnnotations' own test.
vi.mock('../../../../../src/pages/legal/pdf-editor/applyAnnotations', () => ({
  applyAnnotations: mocks.apply,
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUploadImageMutation: () => [mocks.upload],
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: mocks.logError },
}));
vi.mock('@exyconn/shell/components/signature', async () => ({
  SignaturePad: (await import('./pdf-editor.stubs')).SignaturePadStub,
}));

const BYTES = new Uint8Array([37, 80, 68, 70]);
const URL_IN = 'https://cdn.example.com/legal-contracts/msa.pdf';
const SAVED_URL = 'https://cdn.example.com/legal-contracts/msa-edited.pdf';

const onClose = vi.fn();
const onSaved = vi.fn();

const renderEditor = (url: string | null = URL_IN) =>
  renderWithProviders(
    <PdfEditorDialog
      url={url}
      fileName="MSA.PDF"
      folder="legal-contracts"
      onClose={onClose}
      onSaved={onSaved}
    />,
  );

const button = (name: string) => screen.getByRole('button', { name });

/** The first page's annotation layer, measured as 400 × 400 px at the origin. */
function layer() {
  const element = screen.getByTestId('pdf-layer-0');
  element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
  return element;
}

/** Drags a box out on the first page with whatever tool is chosen. */
function dragBox() {
  const target = layer();
  fireEvent.pointerDown(target, { clientX: 40, clientY: 40 });
  fireEvent.pointerMove(target, { clientX: 200, clientY: 120 });
  fireEvent.pointerUp(target, { clientX: 200, clientY: 120 });
}

const annotations = (kind: string) => document.querySelectorAll(`[data-annotation="${kind}"]`);

describe('PdfEditorDialog', () => {
  beforeEach(() => {
    mocks.file = { bytes: BYTES, doc: fakePdfDoc(2), error: null };
    mocks.apply.mockReset().mockResolvedValue(new Uint8Array([1, 2, 3]));
    mocks.upload.mockReset().mockResolvedValue({ data: { uploadImage: SAVED_URL } });
    mocks.logError.mockReset();
    onClose.mockReset();
    onSaved.mockReset();
    vi.stubGlobal('Image', LoadingImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays closed without a file', () => {
    renderEditor(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows progress while the PDF opens, with nothing to save yet', () => {
    mocks.file = { bytes: null, doc: null, error: null };
    renderEditor();
    expect(screen.getByRole('progressbar', { name: 'Opening the PDF' })).toBeInTheDocument();
    expect(button('Save PDF')).toBeDisabled();
  });

  it('says why the PDF could not be opened', () => {
    mocks.file = { bytes: null, doc: null, error: 'The file could not be downloaded (404).' };
    renderEditor();
    expect(screen.getByText('The file could not be downloaded (404).')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('paints every page, each labelled with its place', async () => {
    const doc = fakePdfDoc(2);
    mocks.file = { bytes: BYTES, doc, error: null };
    renderEditor();

    expect(screen.getByLabelText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 2 of 2')).toBeInTheDocument();
    await waitFor(() => expect(doc.render).toHaveBeenCalledTimes(2));
    expect(doc.getPage).toHaveBeenCalledWith(1);
    expect(doc.getPage).toHaveBeenCalledWith(2);
    expect(button('Save PDF')).toBeDisabled();
  });

  it('logs a page that fails to render rather than breaking the editor', async () => {
    const doc = fakePdfDoc(
      1,
      vi.fn(() => ({ promise: Promise.reject(new Error('bad page')) })),
    );
    mocks.file = { bytes: BYTES, doc, error: null };
    renderEditor();

    await waitFor(() =>
      expect(mocks.logError).toHaveBeenCalledWith(
        'Legal: a PDF page failed to render',
        expect.any(Error),
      ),
    );
    expect(screen.getByLabelText('Page 1 of 1')).toBeInTheDocument();
  });

  it('draws a box, shows it while dragging, then saves a new file and hands back its link', async () => {
    renderEditor();
    await userEvent.click(button('Rectangle'));
    const target = layer();
    fireEvent.pointerDown(target, { clientX: 40, clientY: 40 });
    fireEvent.pointerMove(target, { clientX: 200, clientY: 120 });
    expect(target.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    fireEvent.pointerUp(target, { clientX: 200, clientY: 120 });
    expect(annotations('rect')).toHaveLength(1);

    await userEvent.click(button('Save PDF'));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(SAVED_URL));
    expect(mocks.apply).toHaveBeenCalledWith(BYTES, [
      expect.objectContaining({
        kind: 'rect',
        page: 0,
        x: 0.1,
        y: 0.1,
        w: 0.4,
        h: expect.closeTo(0.2),
      }),
    ]);
    expect(mocks.upload).toHaveBeenCalledWith({
      variables: {
        file: expect.stringMatching(/^data:application\/pdf;base64,/),
        fileName: 'MSA-edited.pdf',
        folder: 'legal-contracts',
      },
    });
    expect(await screen.findByText('The edited PDF is saved')).toBeInTheDocument();
  });

  it('shows a highlight’s preview in the highlighter’s colour', async () => {
    renderEditor();
    await userEvent.click(button('Highlight'));
    const target = layer();
    fireEvent.pointerDown(target, { clientX: 40, clientY: 40 });
    fireEvent.pointerMove(target, { clientX: 200, clientY: 120 });

    expect(target.querySelector('[aria-hidden="true"]')).toHaveStyle({ opacity: '0.35' });
  });

  it('draws no box preview for a freehand stroke', async () => {
    renderEditor();
    await userEvent.click(button('Draw freehand'));
    const target = layer();
    fireEvent.pointerDown(target, { clientX: 40, clientY: 40 });
    fireEvent.pointerMove(target, { clientX: 200, clientY: 120 });
    expect(target.querySelector('div[aria-hidden="true"]')).not.toBeInTheDocument();
    fireEvent.pointerUp(target, { clientX: 200, clientY: 120 });

    expect(target.querySelector('polyline')).toBeInTheDocument();
  });

  it('keeps the editor open and says why when saving fails', async () => {
    mocks.upload.mockRejectedValue(new Error('The CDN is down'));
    renderEditor();
    await userEvent.click(button('White-out (cover text)'));
    dragBox();
    await userEvent.click(button('Save PDF'));

    expect(await screen.findByText('The CDN is down')).toBeInTheDocument();
    expect(mocks.logError).toHaveBeenCalledWith(
      'Legal: saving an edited PDF failed',
      expect.any(Error),
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(button('Save PDF')).toBeEnabled();
  });

  it('treats an upload that answers with no link as a failure', async () => {
    mocks.upload.mockResolvedValue({ data: null });
    renderEditor();
    await userEvent.click(button('White-out (cover text)'));
    dragBox();
    await userEvent.click(button('Save PDF'));

    expect(await screen.findByText('Upload returned no URL')).toBeInTheDocument();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    mocks.apply.mockRejectedValue('broken');
    renderEditor();
    await userEvent.click(button('White-out (cover text)'));
    dragBox();
    await userEvent.click(button('Save PDF'));

    expect(await screen.findByText('The edited PDF could not be saved')).toBeInTheDocument();
  });

  it('deletes the selected annotation from the keyboard, but not while typing', async () => {
    renderEditor();
    await userEvent.click(button('White-out (cover text)'));
    dragBox();
    const dialog = screen.getByRole('dialog');

    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(annotations('whiteout')).toHaveLength(1);
    fireEvent.keyDown(dialog, { key: 'Delete' });
    expect(annotations('whiteout')).toHaveLength(0);

    await userEvent.click(button('Undo'));
    expect(annotations('whiteout')).toHaveLength(1);
    fireEvent.keyDown(dialog, { key: 'Backspace' });
    expect(annotations('whiteout')).toHaveLength(1);
  });

  it('puts the Select tool back on Escape', async () => {
    renderEditor();
    await userEvent.click(button('Rectangle'));
    expect(button('Rectangle')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(button('Select and move')).toHaveAttribute('aria-pressed', 'true');
    // Putting the tool down must not throw the editor, and its annotations, away.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape once the Select tool is in hand', () => {
    renderEditor();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('types text where the page is clicked, and drops a text box left empty', async () => {
    renderEditor();
    await userEvent.click(button('Add text'));
    fireEvent.pointerDown(layer(), { clientX: 40, clientY: 40 });
    const field = screen.getByRole('textbox', { name: 'Text on the page' });
    fireEvent.change(field, { target: { value: 'Initialled' } });
    fireEvent.blur(field);
    expect(screen.getByText('Initialled')).toBeInTheDocument();

    fireEvent.pointerDown(layer(), { clientX: 200, clientY: 200 });
    fireEvent.blur(screen.getByRole('textbox', { name: 'Text on the page' }));

    expect(annotations('text')).toHaveLength(1);
  });

  it('places a drawn signature where the page is clicked next', async () => {
    renderEditor();
    await userEvent.click(button('Add signature'));
    expect(screen.getByRole('heading', { name: 'Add your signature' })).toBeInTheDocument();
    await userEvent.click(button('Draw a signature'));
    await userEvent.click(button('Place on page'));
    // The editor is hidden from assistive tech until the picture dialog has fully closed.
    await waitFor(() => expect(button('Add signature')).toHaveAttribute('aria-pressed', 'true'));

    act(() => {
      fireEvent.pointerDown(layer(), { clientX: 40, clientY: 40 });
    });

    expect(document.querySelector('[data-annotation="image"] img')).toHaveAttribute(
      'src',
      PAD_SIGNATURE,
    );
    expect(button('Select and move')).toHaveAttribute('aria-pressed', 'true');
  });

  it('closes the picture dialog on its Cancel, and the editor on its own', async () => {
    renderEditor();
    await userEvent.click(button('Add image'));
    expect(screen.getByRole('heading', { name: 'Add an image' })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Cancel' }).at(-1) as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Add an image' })).not.toBeInTheDocument(),
    );

    await userEvent.click(button('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

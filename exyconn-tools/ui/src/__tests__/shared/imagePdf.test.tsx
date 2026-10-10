import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImageUpload } from '../../shared/components/ImageUpload';
import { PdfPreview } from '../../shared/components/PdfPreview';
import { deleteImage, uploadImage } from '../../shared/services/api';

const pdf = vi.hoisted(() => ({
  getDocument: vi.fn(),
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: pdf.getDocument,
}));

vi.mock('../../shared/services/api', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

const imageFile = (name = 'logo.png', type = 'image/png', bytes = 10) =>
  new File([new Uint8Array(bytes)], name, { type });

beforeEach(() => {
  vi.mocked(uploadImage).mockReset();
  vi.mocked(deleteImage).mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe('ImageUpload (shared)', () => {
  const setup = (props: Partial<React.ComponentProps<typeof ImageUpload>> = {}) => {
    const onChange = vi.fn();
    const view = render(<ImageUpload value="" onChange={onChange} {...props} />);
    const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    return { onChange, input, ...view };
  };

  it('uploads a chosen image to the default folder and reports its URL and id', async () => {
    vi.mocked(uploadImage).mockResolvedValue({ success: true, url: 'https://cdn/a.png', fileId: 'f1' });
    const { onChange, input } = setup();
    const file = imageFile('a.png');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://cdn/a.png', 'f1'));
    expect(uploadImage).toHaveBeenCalledWith(file, '/email-signatures', 'a.png');
  });

  it('uses the folder and label it is given', async () => {
    vi.mocked(uploadImage).mockResolvedValue({ success: true, url: 'u' });
    const { input } = setup({ folder: '/logos', label: 'Drop logo', helperText: 'PNG only' });
    expect(screen.getByText('Drop logo')).toBeInTheDocument();
    expect(screen.getByText('PNG only')).toBeInTheDocument();
    const file = imageFile();
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file, '/logos', 'logo.png'));
  });

  it('refuses a file over the size limit and one that is not an image', async () => {
    const { input } = setup({ maxSize: 1 });
    fireEvent.change(input, { target: { files: [imageFile('big.png', 'image/png', 1024 * 1024 + 1)] } });
    expect(await screen.findByText('File size must be less than 1MB')).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [imageFile('notes.txt', 'text/plain')] } });
    expect(await screen.findByText('Please select an image file')).toBeInTheDocument();
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('shows the server error, or a default one, and hides the helper text while an error shows', async () => {
    vi.mocked(uploadImage)
      .mockResolvedValueOnce({ success: false, error: 'Quota exceeded' })
      .mockResolvedValueOnce({ success: false });
    const { input } = setup({ helperText: 'Max 5MB' });
    fireEvent.change(input, { target: { files: [imageFile()] } });
    expect(await screen.findByText('Quota exceeded')).toBeInTheDocument();
    expect(screen.queryByText('Max 5MB')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { files: [imageFile()] } });
    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });

  it('logs and reports a thrown upload', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(uploadImage).mockRejectedValue(new Error('boom'));
    const { input } = setup();
    fireEvent.change(input, { target: { files: [imageFile()] } });
    expect(await screen.findByText('Upload failed. Please try again.')).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Image upload failed', expect.any(Error));
  });

  it('shows progress while uploading and ignores clicks on the zone', async () => {
    let finish: (value: { success: boolean; url: string }) => void = () => undefined;
    vi.mocked(uploadImage).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    const { input } = setup();
    fireEvent.change(input, { target: { files: [imageFile()] } });
    const bar = await screen.findByRole('progressbar');
    fireEvent.click(bar.parentElement as HTMLElement);
    expect(click).not.toHaveBeenCalled();
    await act(async () => finish({ success: true, url: 'u' }));
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  it('opens the picker from the drop zone and handles a file dropped on it', async () => {
    vi.mocked(uploadImage).mockResolvedValue({ success: true, url: 'dropped-url' });
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    const { onChange } = setup();
    const zone = screen.getByText('Upload Image').parentElement as HTMLElement;
    fireEvent.click(zone);
    expect(click).toHaveBeenCalledTimes(1);

    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [imageFile()] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('dropped-url', undefined));

    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    expect(uploadImage).toHaveBeenCalledTimes(1);
  });

  it('shows the uploaded image, replaces it through the picker and removes it with its id', async () => {
    vi.mocked(deleteImage).mockResolvedValue(true);
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    const { onChange } = setup({ value: 'https://cdn/a.png', fileId: 'f1' });
    expect(screen.getByAltText('Uploaded')).toHaveAttribute('src', 'https://cdn/a.png');
    fireEvent.click(screen.getByRole('button', { name: /Replace/ }));
    expect(click).toHaveBeenCalledTimes(1);

    const remove = screen.getAllByRole('button').find((button) => !button.textContent) as HTMLElement;
    fireEvent.click(remove);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('', undefined));
    expect(deleteImage).toHaveBeenCalledWith('f1');
  });

  it('removes an image without calling the server when it has no id', async () => {
    const { onChange } = setup({ value: 'https://cdn/a.png', circular: true });
    const remove = screen.getAllByRole('button').find((button) => !button.textContent) as HTMLElement;
    fireEvent.click(remove);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('', undefined));
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it('clears the file input after a selection so the same file can be chosen again', async () => {
    vi.mocked(uploadImage).mockResolvedValue({ success: true, url: 'u' });
    const { input } = setup();
    fireEvent.change(input, { target: { files: [imageFile()] } });
    await waitFor(() => expect(uploadImage).toHaveBeenCalled());
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { files: [] } });
    expect(uploadImage).toHaveBeenCalledTimes(1);
  });
});

describe('PdfPreview', () => {
  const pdfFile = () => ({ arrayBuffer: async () => new ArrayBuffer(8) }) as unknown as File;

  const documentWith = (numPages: number, options: { failRender?: boolean } = {}) => {
    const render = vi.fn(() => ({ promise: options.failRender ? Promise.reject(new Error('x')) : Promise.resolve() }));
    const getPage = vi.fn(async () => ({
      getViewport: ({ scale }: { scale: number }) => ({ width: 100 * scale, height: 200 * scale }),
      render,
    }));
    pdf.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages, getPage }) });
    return { render, getPage };
  };

  it('renders nothing without a file', () => {
    const { container } = render(<PdfPreview file={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a skeleton while loading, then the first page scaled to the height limit', async () => {
    const { getPage, render: renderPage } = documentWith(3);
    const { container } = render(<PdfPreview file={pdfFile()} maxHeight={100} />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    await waitFor(() => expect(renderPage).toHaveBeenCalled());
    expect(getPage).toHaveBeenCalledWith(1);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    // 100px limit over a 200px page is 0.5, so the 100px wide page is drawn 50px wide.
    expect([canvas.width, canvas.height]).toEqual([50, 100]);
  });

  it('caps the zoom at 1.5 for small pages', async () => {
    documentWith(1);
    const { container } = render(<PdfPreview file={pdfFile()} maxHeight={1000} />);
    await screen.findByText('1 page');
    await waitFor(() => expect((container.querySelector('canvas') as HTMLCanvasElement).width).toBe(150));
  });

  it('pages forward and back within bounds', async () => {
    const { getPage } = documentWith(2);
    render(<PdfPreview file={pdfFile()} />);
    await screen.findByText('Page 1 of 2');
    const [previous, next] = screen.getAllByRole('button');
    expect(previous).toBeDisabled();
    fireEvent.click(next);
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    expect(next).toBeDisabled();
    await waitFor(() => expect(getPage).toHaveBeenCalledWith(2));
    fireEvent.click(previous);
    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('hides the page controls when asked to', async () => {
    documentWith(4);
    render(<PdfPreview file={pdfFile()} showPageNav={false} />);
    await waitFor(() => expect(document.querySelector('canvas')).toBeInTheDocument());
    expect(screen.queryByText(/Page 1 of 4/)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('says it cannot preview a PDF that fails to load', async () => {
    pdf.getDocument.mockReturnValue({ promise: Promise.reject(new Error('corrupt')) });
    render(<PdfPreview file={pdfFile()} />);
    expect(await screen.findByText('Unable to preview PDF')).toBeInTheDocument();
  });

  it('keeps the preview when a page fails to draw', async () => {
    const { render: renderPage } = documentWith(1, { failRender: true });
    render(<PdfPreview file={pdfFile()} />);
    await screen.findByText('1 page');
    await waitFor(() => expect(renderPage).toHaveBeenCalled());
    expect(screen.getByText('1 page')).toBeInTheDocument();
  });

  it('forgets the document when the file is removed', async () => {
    documentWith(2);
    const { rerender, container } = render(<PdfPreview file={pdfFile()} />);
    await screen.findByText('Page 1 of 2');
    rerender(<PdfPreview file={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

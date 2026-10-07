import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuilderScreen } from '../../../../../src/pages/cms/builder/BuilderScreen';
import { UrlProbe, renderInSite } from '../cms-helpers';
import { CANVAS_HTML, RESOURCES, harness } from './builder-screen.stubs';

vi.mock('@exyconn/live-editor', async () =>
  (await import('./builder-screen.stubs')).liveEditorModule(),
);
vi.mock('@exyconn/cms', () => ({ compileHtml: () => [] }));
vi.mock('../../../../../src/pages/cms/media', async () => {
  const { harness: doubles } = await import('./builder-screen.stubs');
  return { useMediaUpload: () => doubles.upload };
});
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => {
  const { harness: doubles } = await import('./builder-screen.stubs');
  return { ...(await importOriginal<object>()), useConfirm: () => doubles.confirm };
});

type Props = ComponentProps<typeof BuilderScreen>;

function renderScreen(overrides: Partial<Props> = {}) {
  const props: Props = {
    title: 'About us',
    caption: 'Page /about-us',
    status: 'DRAFT',
    backPath: '/website/s/main/pages',
    initial: { html: '<p>Start</p>', css: '' },
    projectData: undefined,
    resources: RESOURCES,
    saveDraft: vi.fn().mockResolvedValue({}),
    publish: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
  renderInSite(
    <>
      <BuilderScreen {...props} />
      <UrlProbe />
    </>,
    { route: '/website/s/main/pages/page-1/edit' },
  );
  return props;
}

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const url = () => screen.getByLabelText('current url');

describe('BuilderScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    harness.editor = null;
    harness.plugin = null;
  });

  it("mounts the canvas with the site's blocks, plugin, design and media", () => {
    renderScreen({ children: <p>Page drawers</p> });

    expect(screen.getByText('About us')).toBeInTheDocument();
    expect(screen.getByText('Page drawers')).toBeInTheDocument();
    expect(harness.editor).toMatchObject({
      initial: { html: '<p>Start</p>', css: '' },
      projectData: null,
      canvasStyles: RESOURCES.canvasStyles,
      canvasClass: 'cms-page',
      canvasCss: ':root {}',
      blocks: ['0 components', '1 fragments'],
      plugins: ['cms-plugin'],
      assets: RESOURCES.assets,
      uploadImage: harness.upload,
    });
    expect(harness.plugin?.fragments).toBe(RESOURCES.fragments);
  });

  it('opens a saved GrapesJS project as it was', () => {
    renderScreen({ projectData: { pages: ['home'] } });
    expect(harness.editor?.projectData).toEqual({ pages: ['home'] });
  });

  it('saves the canvas as a draft from the toolbar', async () => {
    const props = renderScreen();

    await click('Edit canvas');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await click('Save draft');

    expect(props.saveDraft).toHaveBeenCalledWith({ projectData: {}, html: CANVAS_HTML, css: '' });
    expect(await screen.findByText('Draft saved')).toBeInTheDocument();
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
  });

  it('keeps the work unsaved when the save fails', async () => {
    renderScreen({ saveDraft: vi.fn().mockRejectedValue(new Error('Draft too large')) });

    await click('Edit canvas');
    await click('Save draft');

    expect(await screen.findByText('Draft too large')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('publishes from the toolbar', async () => {
    const props = renderScreen();
    await click('Publish');

    expect(props.publish).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('Published — the site shows this version now'),
    ).toBeInTheDocument();
  });

  it('shows a canvas error such as a failed upload', async () => {
    renderScreen();
    await click('Fail upload');
    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });

  it('leaves straight away when everything is saved', async () => {
    renderScreen();
    await click('Back');

    expect(harness.confirm).not.toHaveBeenCalled();
    expect(url()).toHaveTextContent('/website/s/main/pages');
  });

  it('asks before leaving unsaved work, and stays when told to', async () => {
    harness.confirm.mockResolvedValueOnce(false);
    renderScreen();
    await click('Edit canvas');
    await click('Back');

    expect(harness.confirm).toHaveBeenCalledWith({
      title: 'Leave without saving?',
      message: 'Your changes have not been saved and will be lost.',
      confirmText: 'Leave',
      destructive: true,
    });
    expect(url()).toHaveTextContent('/website/s/main/pages/page-1/edit');
  });

  it('leaves unsaved work once confirmed', async () => {
    harness.confirm.mockResolvedValueOnce(true);
    renderScreen();
    await click('Edit canvas');
    await click('Back');

    expect(await screen.findByText(/^\/website\/s\/main\/pages$/)).toBeInTheDocument();
  });

  it('reports a confirmation that could not be shown', async () => {
    harness.confirm.mockRejectedValueOnce('dialog gone');
    renderScreen();
    await click('Edit canvas');
    await click('Back');

    expect(await screen.findByText('Could not go back')).toBeInTheDocument();
  });
});

import type { ComponentProps } from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuilderScreen } from '../../../../../src/pages/cms/builder/BuilderScreen';
import { UrlProbe, renderInSite } from '../cms-helpers';
import { RESOURCES, harness, matchEveryMediaQuery } from './builder-screen.stubs';

vi.mock('@exyconn/live-editor', async () =>
  (await import('./builder-screen.stubs')).liveEditorModule(),
);
vi.mock('@exyconn/cms', () => ({ compileHtml: () => [] }));
vi.mock('../../../../../src/pages/cms/media', async () => {
  const { harness: doubles } = await import('./builder-screen.stubs');
  return { useMediaUpload: () => doubles.upload };
});
vi.mock('../../../../../src/pages/website/forms/cms-component-props', () => ({
  ComponentPropsForm: (props: Readonly<{ onCancel: () => void }>) => (
    <button type="button" onClick={props.onCancel}>
      Cancel props
    </button>
  ),
}));

type Props = ComponentProps<typeof BuilderScreen>;

function renderScreen(overrides: Partial<Props> = {}) {
  const props: Props = {
    title: 'About us',
    caption: 'Page /about-us',
    status: 'DRAFT',
    backPath: '/website/s/main/pages',
    initial: { html: '', css: '' },
    projectData: null,
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
const PREVIEW = 'https://exyconn.com/cms-preview?token=t';

describe('BuilderScreen tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    harness.plugin = null;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('previews without saving when everything is saved', async () => {
    const onPreview = vi.fn();
    const props = renderScreen({ onPreview });
    await click('Preview');

    const saveFirst = onPreview.mock.calls[0][0] as () => Promise<unknown>;
    await expect(saveFirst()).resolves.toBe(true);
    expect(props.saveDraft).not.toHaveBeenCalled();
  });

  it('saves unsaved work quietly before the preview loads', async () => {
    const onPreview = vi.fn();
    const props = renderScreen({ onPreview });
    await click('Edit canvas');
    await click('Preview');

    const saveFirst = onPreview.mock.calls[0][0] as () => Promise<unknown>;
    await act(async () => {
      await expect(saveFirst()).resolves.toBe(true);
    });
    expect(props.saveDraft).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Draft saved')).not.toBeInTheDocument();
  });

  it('offers no preview or live preview the page did not ask for', () => {
    renderScreen();
    expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show live preview' })).not.toBeInTheDocument();
  });

  it('shows the saved draft beside the canvas and refreshes it after a save', async () => {
    const loadPreviewUrl = vi.fn().mockResolvedValue(PREVIEW);
    renderScreen({ loadPreviewUrl });

    await click('Show live preview');
    expect(await screen.findByTitle('Live preview')).toHaveAttribute('src', `${PREVIEW}&v=0-0`);

    await click('Save draft');
    await waitFor(() =>
      expect(screen.getByTitle('Live preview')).toHaveAttribute('src', `${PREVIEW}&v=1-0`),
    );

    await click('Hide live preview');
    expect(screen.queryByRole('region', { name: 'Live preview' })).not.toBeInTheDocument();
  });

  it("opens a component's settings when the canvas asks, and closes them", async () => {
    renderScreen();
    const apply = vi.fn();

    act(() => {
      harness.plugin?.onEditComponent({ key: 'hero', label: 'Hero', props: {}, apply });
    });
    expect(screen.getByRole('heading', { name: 'Hero' })).toBeInTheDocument();

    await click('Cancel props');
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Hero' })).not.toBeInTheDocument(),
    );
    expect(apply).not.toHaveBeenCalled();
  });

  it('sends a phone back with a note instead of a canvas', async () => {
    matchEveryMediaQuery();
    renderScreen();

    expect(await screen.findByText('Live editing needs a bigger screen')).toBeInTheDocument();
    expect(screen.queryByText('Canvas')).not.toBeInTheDocument();

    await click('Back');
    expect(screen.getByLabelText('current url')).toHaveTextContent('/website/s/main/pages');
  });
});

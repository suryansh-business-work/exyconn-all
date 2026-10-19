import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PREVIEW_PARAM,
  QuickViewDrawer,
  QuickViewPanel,
  usePreviewParam,
} from '../../../../src/records/quick-view';
import { renderHookWithProviders, renderWithProviders, useCurrentUrl } from '../../test-utils';

const PANEL = {
  fullViewTo: '/companies/c-1',
  onRetry: vi.fn(),
  loadingLabel: 'Loading the company',
  errorText: 'Could not load the company.',
};

describe('QuickViewPanel', () => {
  it('shows the summary under the toolbar once it has loaded', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <QuickViewPanel {...PANEL} onClose={onClose} edit={<button type="button">Edit</button>}>
        <p>Acme summary</p>
      </QuickViewPanel>,
    );
    expect(screen.getByText('Acme summary')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Full view' })).toHaveAttribute(
      'href',
      '/companies/c-1',
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('announces a skeleton while the record loads', () => {
    renderWithProviders(<QuickViewPanel {...PANEL} onClose={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading the company');
  });

  it('shows the failure with Retry when the record could not be read', async () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <QuickViewPanel {...PANEL} onRetry={onRetry} onClose={vi.fn()} error={new Error('Boom')} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to its own message for an error without one', () => {
    renderWithProviders(<QuickViewPanel {...PANEL} onClose={vi.fn()} error={{}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the company.');
  });
});

describe('QuickViewDrawer', () => {
  it('names the open panel and closes on Escape', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <QuickViewDrawer open onClose={onClose} label="Company preview">
        <p>Inside</p>
      </QuickViewDrawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Company preview' })).toHaveTextContent('Inside');
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing while closed', () => {
    renderWithProviders(
      <QuickViewDrawer open={false} onClose={vi.fn()} label="Company preview">
        <p>Inside</p>
      </QuickViewDrawer>,
    );
    expect(screen.queryByText('Inside')).not.toBeInTheDocument();
  });
});

describe('usePreviewParam', () => {
  const renderParam = (route: string) =>
    renderHookWithProviders(() => ({ ...usePreviewParam(), url: useCurrentUrl() }), { route });

  it('reads the previewed record from the URL', () => {
    const { result } = renderParam(`/companies?view=v1&${PREVIEW_PARAM}=c-1`);
    expect(result.current.previewId).toBe('c-1');
  });

  it('is empty without a preview parameter', () => {
    expect(renderParam('/companies').result.current.previewId).toBe('');
  });

  it('opens and closes a preview, keeping the other parameters', () => {
    const { result } = renderParam('/companies?view=v1');
    act(() => result.current.openPreview('c-2'));
    expect(result.current.url).toBe('/companies?view=v1&preview=c-2');
    expect(result.current.previewId).toBe('c-2');
    act(() => result.current.closePreview());
    expect(result.current.url).toBe('/companies?view=v1');
    expect(result.current.previewId).toBe('');
  });
});

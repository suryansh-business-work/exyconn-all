import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BuilderToolbar,
  type BuilderToolbarProps,
} from '../../../../../src/pages/cms/builder/BuilderToolbar';
import { renderWithProviders } from '../../../test-utils';

function renderToolbar(overrides: Partial<BuilderToolbarProps> = {}) {
  const props: BuilderToolbarProps = {
    title: 'About us',
    caption: 'Page /about-us',
    status: 'DRAFT',
    dirty: false,
    saving: false,
    publishing: false,
    onBack: vi.fn(),
    onSave: vi.fn(),
    onPublish: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<BuilderToolbar {...props} />);
  return props;
}

const button = (name: string) => screen.getByRole('button', { name });

describe('BuilderToolbar', () => {
  it('shows what is edited, its status and that everything is saved', () => {
    renderToolbar();

    expect(screen.getByText('Page /about-us')).toBeInTheDocument();
    expect(screen.getByText('About us')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
  });

  it('warns about unsaved changes', () => {
    renderToolbar({ dirty: true });
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('runs back, save and publish', async () => {
    const props = renderToolbar();

    await userEvent.click(button('Back'));
    await userEvent.click(button('Save draft'));
    await userEvent.click(button('Publish'));

    expect(props.onBack).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect(props.onPublish).toHaveBeenCalledTimes(1);
  });

  it('offers only the optional tools it is given', () => {
    renderToolbar();

    for (const name of ['Settings', 'Revisions', 'Show live preview', 'Preview']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  });

  it('runs settings, revisions, preview and the live preview toggle', async () => {
    const props = renderToolbar({
      onSettings: vi.fn(),
      onRevisions: vi.fn(),
      onPreview: vi.fn(),
      onToggleLive: vi.fn(),
    });

    await userEvent.click(button('Settings'));
    await userEvent.click(button('Revisions'));
    await userEvent.click(button('Preview'));
    await userEvent.click(button('Show live preview'));

    expect(props.onSettings).toHaveBeenCalledTimes(1);
    expect(props.onRevisions).toHaveBeenCalledTimes(1);
    expect(props.onPreview).toHaveBeenCalledTimes(1);
    expect(props.onToggleLive).toHaveBeenCalledTimes(1);
  });

  it('offers to hide an open live preview', () => {
    renderToolbar({ onToggleLive: vi.fn(), liveOpen: true });
    expect(button('Hide live preview')).toBeInTheDocument();
  });

  it('blocks save and publish while either runs', () => {
    renderToolbar({ saving: true });
    expect(button('Save draft')).toBeDisabled();
    expect(button('Publish')).toBeDisabled();
  });

  it('blocks save and publish while publishing', () => {
    renderToolbar({ publishing: true });
    expect(button('Save draft')).toBeDisabled();
    expect(button('Publish')).toBeDisabled();
  });
});

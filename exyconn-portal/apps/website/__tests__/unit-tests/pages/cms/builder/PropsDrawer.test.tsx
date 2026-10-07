import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CmsEditRequest } from '@exyconn/live-editor';
import { PropsDrawer } from '../../../../../src/pages/cms/builder/PropsDrawer';
import { renderWithProviders } from '../../../test-utils';

vi.mock('../../../../../src/pages/website/forms/cms-component-props', () => ({
  ComponentPropsForm: (
    props: Readonly<{
      props: Record<string, unknown>;
      siteId: string;
      onCancel: () => void;
      onApply: (props: Record<string, unknown>) => void;
    }>,
  ) => (
    <div>
      <p>{`Props ${JSON.stringify(props.props)} on ${props.siteId}`}</p>
      <button type="button" onClick={props.onCancel}>
        Cancel props
      </button>
      <button type="button" onClick={() => props.onApply({ title: 'New title' })}>
        Apply props
      </button>
    </div>
  ),
}));

const request = (): CmsEditRequest => ({
  key: 'hero-banner',
  label: 'Hero banner',
  props: { title: 'Old title' },
  apply: vi.fn(),
});

describe('PropsDrawer', () => {
  it('is closed without a component to edit', () => {
    renderWithProviders(<PropsDrawer request={null} siteId="site-1" onClose={vi.fn()} />);
    expect(screen.queryByRole('region', { name: 'Component settings' })).not.toBeInTheDocument();
  });

  it("shows the component's name, key and settings form for the site", () => {
    renderWithProviders(<PropsDrawer request={request()} siteId="site-1" onClose={vi.fn()} />);

    expect(screen.getByRole('region', { name: 'Component settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hero banner' })).toBeInTheDocument();
    expect(screen.getByText('hero-banner')).toBeInTheDocument();
    expect(screen.getByText('Props {"title":"Old title"} on site-1')).toBeInTheDocument();
  });

  it('writes the new settings back into the canvas and closes', async () => {
    const onClose = vi.fn();
    const edit = request();
    renderWithProviders(<PropsDrawer request={edit} siteId="site-1" onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Apply props' }));

    expect(edit.apply).toHaveBeenCalledWith({ title: 'New title' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes without applying on cancel', async () => {
    const onClose = vi.fn();
    const edit = request();
    renderWithProviders(<PropsDrawer request={edit} siteId="site-1" onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel props' }));

    expect(edit.apply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

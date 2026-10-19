import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DemoProfile } from '@exyconn/wa-flow';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { WidgetPreview } from '../../../src/widget/WidgetPreview';

const preview = vi.hoisted(() => ({
  bundle: undefined as unknown,
  start: vi.fn(),
  received: [] as unknown[],
}));

vi.mock('../../../src/widget/useWidgetChat', () => ({
  usePreviewWidgetChat: (bundle: unknown) => {
    preview.received.push(bundle);
    return { bundle: preview.bundle, startWorkflow: preview.start };
  },
}));
vi.mock('../../../src/widget/ChatWidget', () => ({
  ChatWidget: ({ chat }: Readonly<{ chat: { bundle: DemoBundle } }>) => (
    <p>Widget for {chat.bundle.demo.key}</p>
  ),
}));

const DRAFT: DemoBundle = { demo: { key: 'draft' } as DemoProfile, workflows: [] };

afterEach(() => {
  preview.start.mockReset();
  preview.received.length = 0;
  preview.bundle = undefined;
});

describe('WidgetPreview', () => {
  it('plays the draft under the preview revision and starts the asked workflow once', () => {
    preview.bundle = DRAFT;
    const { rerender } = render(<WidgetPreview bundle={DRAFT} startWorkflow="order" />);
    expect(preview.received[0]).toEqual({ ...DRAFT, revision: 'preview' });
    expect(screen.getByText('Widget for draft')).toBeInTheDocument();
    expect(preview.start).toHaveBeenCalledWith('order');
    rerender(<WidgetPreview bundle={DRAFT} startWorkflow="other" />);
    expect(preview.start).toHaveBeenCalledTimes(1);
  });

  it('starts nothing when no workflow is asked for', () => {
    preview.bundle = DRAFT;
    render(<WidgetPreview bundle={DRAFT} />);
    expect(preview.start).not.toHaveBeenCalled();
  });

  it('draws nothing until the chat has its bundle', () => {
    const { container } = render(<WidgetPreview bundle={DRAFT} />);
    expect(container).toBeEmptyDOMElement();
  });
});

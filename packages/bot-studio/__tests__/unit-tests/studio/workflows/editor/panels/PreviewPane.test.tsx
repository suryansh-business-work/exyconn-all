import { useEffect } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { PreviewPane } from '../../../../../../src/studio/workflows/editor/panels/PreviewPane';
import { renderWithProviders } from '../../../../test-utils';

const chat = vi.hoisted(() => ({ mounts: 0 }));

function FakeChat({ startWorkflow }: Readonly<{ startWorkflow: string }>) {
  useEffect(() => {
    chat.mounts += 1;
  }, []);
  return <p>Chat from {startWorkflow}</p>;
}

/** The host app's preview, as the studio config hands it to the pane. */
const studio = {
  renderPreview: (_bundle: DemoBundle, startWorkflow: string) => (
    <FakeChat startWorkflow={startWorkflow} />
  ),
};

const BUNDLE = { demo: { key: 'clinic' }, workflows: [] } as unknown as DemoBundle;

describe('PreviewPane', () => {
  beforeEach(() => {
    chat.mounts = 0;
  });

  it('runs the draft from the chosen workflow', () => {
    renderWithProviders(<PreviewPane bundle={BUNDLE} startWorkflow="book" onClose={vi.fn()} />, {
      studio,
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByText('Chat from book')).toBeInTheDocument();
    expect(chat.mounts).toBe(1);
  });

  it('starts a fresh chat on Restart', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreviewPane bundle={BUNDLE} startWorkflow="book" onClose={vi.fn()} />, {
      studio,
    });
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(chat.mounts).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(chat.mounts).toBe(3);
  });

  it('closes', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PreviewPane bundle={BUNDLE} startWorkflow="book" onClose={onClose} />, {
      studio,
    });
    await user.click(screen.getByRole('button', { name: 'Close preview' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

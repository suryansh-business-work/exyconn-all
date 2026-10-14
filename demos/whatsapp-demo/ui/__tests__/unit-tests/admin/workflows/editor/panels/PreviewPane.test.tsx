import { useEffect } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { PreviewPane } from '../../../../../../src/admin/workflows/editor/panels/PreviewPane';
import { renderWithProviders } from '../../../../test-utils';

const chat = vi.hoisted(() => ({ mounts: 0 }));

function FakeChat({ startWorkflow }: Readonly<{ startWorkflow: string }>) {
  useEffect(() => {
    chat.mounts += 1;
  }, []);
  return <p>Chat from {startWorkflow}</p>;
}

vi.mock('../../../../../../src/components/wa/preview', () => ({
  ChatPreview: (props: Readonly<{ startWorkflow: string }>) => <FakeChat {...props} />,
}));

const BUNDLE = { demo: { key: 'clinic' }, workflows: [] } as unknown as DemoBundle;

describe('PreviewPane', () => {
  beforeEach(() => {
    chat.mounts = 0;
  });

  it('runs the draft from the chosen workflow', () => {
    renderWithProviders(<PreviewPane bundle={BUNDLE} startWorkflow="book" onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByText('Chat from book')).toBeInTheDocument();
    expect(chat.mounts).toBe(1);
  });

  it('starts a fresh chat on Restart', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PreviewPane bundle={BUNDLE} startWorkflow="book" onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(chat.mounts).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(chat.mounts).toBe(3);
  });

  it('closes', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PreviewPane bundle={BUNDLE} startWorkflow="book" onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close preview' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

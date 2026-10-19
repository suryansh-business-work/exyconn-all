import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WidgetHeader } from '../../../src/widget/WidgetHeader';
import { renderWithProviders } from '../test-utils';
import { demoProfile, LOOK } from './widget.fixtures';

describe('WidgetHeader', () => {
  it('names the business in its colour and restarts the chat', async () => {
    const onRestart = vi.fn();
    const { container } = renderWithProviders(
      <WidgetHeader demo={demoProfile()} look={LOOK} onRestart={onRestart} />,
    );
    expect(screen.getByRole('heading', { name: 'Green Grocer' })).toBeInTheDocument();
    expect(screen.getByText('AI assistant · replies instantly')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({ backgroundColor: 'rgb(6, 168, 138)' });
    await userEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('offers Close only when the widget can be minimised', async () => {
    const onClose = vi.fn();
    const { rerender } = renderWithProviders(
      <WidgetHeader demo={demoProfile()} look={LOOK} onRestart={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Close chat' })).not.toBeInTheDocument();
    rerender(<WidgetHeader demo={demoProfile()} look={LOOK} onRestart={vi.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close chat' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudioFooter } from '../../../../../../../src/pages/marketing/forms/campaign/studio/StudioFooter';
import { renderWithProviders } from '../../../../../test-utils';

function renderFooter(props: Partial<Parameters<typeof StudioFooter>[0]> = {}) {
  const handlers = { onBack: vi.fn(), onNext: vi.fn(), onSave: vi.fn() };
  renderWithProviders(
    <StudioFooter
      draft={{ status: 'saved', error: null, dirty: false }}
      isFirst={false}
      isLast={false}
      busy={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('StudioFooter', () => {
  it('shows where the draft stands and moves back, saves and moves on', async () => {
    const { onBack, onNext, onSave } = renderFooter();
    expect(screen.getByRole('status')).toHaveTextContent('All changes saved');
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('cannot go back from the first step', () => {
    renderFooter({ isFirst: true });
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
  });

  it('has no Next on the last step', () => {
    renderFooter({ isLast: true });
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('locks every action while a step change is saving', () => {
    renderFooter({ busy: true, draft: { status: 'saving', error: null, dirty: true } });
    for (const name of ['Back', 'Save draft', 'Next']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  });
});

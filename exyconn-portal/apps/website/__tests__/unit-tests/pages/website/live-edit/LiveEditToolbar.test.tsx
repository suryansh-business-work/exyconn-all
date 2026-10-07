import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { LiveEditToolbar } from '../../../../../src/pages/website/live-edit/LiveEditToolbar';
import { NeedsBiggerScreen } from '../../../../../src/pages/website/live-edit/NeedsBiggerScreen';
import { renderWithProviders } from '../../../test-utils';

interface ToolbarState {
  dirty?: boolean;
  saving?: boolean;
}

function renderToolbar({ dirty = false, saving = false }: Readonly<ToolbarState> = {}) {
  const onBack = vi.fn();
  const onSave = vi.fn();
  renderWithProviders(
    <LiveEditToolbar
      title="Why agents fail"
      pageUrl="https://exyconn.com/blog/why-agents-fail"
      dirty={dirty}
      saving={saving}
      onBack={onBack}
      onSave={onSave}
    />,
  );
  return { onBack, onSave };
}

describe('LiveEditToolbar', () => {
  it('names what is being edited and links to it on the site', () => {
    renderToolbar();
    expect(screen.getByText('Live edit')).toBeInTheDocument();
    expect(screen.getByText('Why agents fail')).toBeInTheDocument();
    const view = screen.getByRole('link', { name: 'View on site' });
    expect(view).toHaveAttribute('href', 'https://exyconn.com/blog/why-agents-fail');
    expect(view).toHaveAttribute('target', '_blank');
    expect(view).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows everything saved and keeps Save off while clean', () => {
    const { onSave } = renderToolbar();
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('flags unsaved changes and saves on click', () => {
    const { onSave } = renderToolbar({ dirty: true });
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('shows the save in progress and blocks a second one', () => {
    renderToolbar({ dirty: true, saving: true });
    const saving = screen.getByRole('button', { name: 'Saving…' });
    expect(saving).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('goes back from the labelled back button', () => {
    const { onBack } = renderToolbar({ dirty: true });
    fireEvent.click(screen.getByRole('button', { name: 'Back to the list' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('NeedsBiggerScreen', () => {
  it('explains where to edit the design and offers a way back', () => {
    const onBack = vi.fn();
    renderWithProviders(<NeedsBiggerScreen onBack={onBack} />);
    expect(screen.getByText('Live editing needs a bigger screen')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Open this page on a laptop to edit its design. You can still edit its content here.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

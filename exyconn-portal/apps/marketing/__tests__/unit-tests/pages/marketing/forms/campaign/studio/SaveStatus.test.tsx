import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveStatus } from '../../../../../../../src/pages/marketing/forms/campaign/studio/SaveStatus';
import { renderWithProviders } from '../../../../../test-utils';

describe('SaveStatus', () => {
  it.each([
    ['idle', false, 'Draft not saved yet — add a name'],
    ['idle', true, 'Unsaved changes'],
    ['saving', true, 'Saving…'],
    ['failed', true, 'Save failed'],
    ['saved', false, 'All changes saved'],
    ['saved', true, 'Unsaved changes'],
  ] as const)('reads “%s” (dirty: %s) as “%s”', (status, dirty, label) => {
    renderWithProviders(<SaveStatus status={status} error={null} dirty={dirty} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('shows a spinner while saving and an icon once saved', () => {
    const { rerender } = renderWithProviders(<SaveStatus status="saving" error={null} dirty />);
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    rerender(<SaveStatus status="saved" error={null} dirty={false} />);
    expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
    expect(screen.getByTestId('CheckCircleOutlinedIcon')).toBeInTheDocument();
  });

  it('explains a failed save on hover', async () => {
    renderWithProviders(<SaveStatus status="failed" error="Version conflict" dirty />);
    expect(screen.getByTestId('ErrorOutlinedIcon')).toBeInTheDocument();
    await userEvent.hover(screen.getByText('Save failed'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Version conflict');
  });
});

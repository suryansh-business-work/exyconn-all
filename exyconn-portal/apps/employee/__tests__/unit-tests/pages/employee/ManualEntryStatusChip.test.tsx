import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { ManualEntryStatusChip } from '../../../../src/pages/employee/ManualEntryStatusChip';

describe('ManualEntryStatusChip', () => {
  it.each([
    ['PENDING', 'Awaiting review', 'MuiChip-colorWarning'],
    ['APPROVED', 'Approved', 'MuiChip-colorSuccess'],
    ['REJECTED', 'Rejected', 'MuiChip-colorError'],
  ] as const)('labels a %s claim and colours it', (status, label, colourClass) => {
    renderWithProviders(<ManualEntryStatusChip status={status} />);
    const chip = screen.getByText(label).closest('.MuiChip-root');
    expect(chip).toHaveClass(colourClass);
  });

  it('shows the reviewer note on hover when one is given', async () => {
    renderWithProviders(<ManualEntryStatusChip status="REJECTED" note="Outside working hours" />);
    await userEvent.hover(screen.getByText('Rejected'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Outside working hours');
  });

  it('renders no tooltip wrapper without a note', async () => {
    renderWithProviders(<ManualEntryStatusChip status="APPROVED" note={null} />);
    await userEvent.hover(screen.getByText('Approved'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

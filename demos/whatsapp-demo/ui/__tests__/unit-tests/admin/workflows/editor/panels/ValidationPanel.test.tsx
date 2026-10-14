import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GraphIssue } from '@exyconn/wa-flow';
import { ValidationPanel } from '../../../../../../src/admin/workflows/editor/panels/ValidationPanel';
import { renderWithProviders } from '../../../../test-utils';

const DEAD: GraphIssue = {
  severity: 'error',
  nodeId: 'buttons-1',
  message: 'Button "{title}" leads nowhere.',
  values: { title: 'Yes' },
};
const UNREACHABLE: GraphIssue = {
  severity: 'warning',
  nodeId: 'text-2',
  message: 'Never reached.',
};
const NO_START: GraphIssue = { severity: 'error', message: 'The start node is missing.' };

describe('ValidationPanel', () => {
  it('says the workflow is ready when there is nothing to fix', () => {
    renderWithProviders(<ValidationPanel issues={[]} onPick={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('No problems found. Ready to publish.');
    expect(screen.queryByRole('region', { name: 'Problems' })).toBeNull();
  });

  it('counts errors and warnings and lists each issue with its node', () => {
    renderWithProviders(
      <ValidationPanel issues={[DEAD, UNREACHABLE, NO_START]} onPick={vi.fn()} />,
    );
    const region = screen.getByRole('region', { name: 'Problems' });
    expect(within(region).getByRole('status')).toHaveTextContent('2 errors, 1 warnings');
    expect(within(region).getByText('Button "Yes" leads nowhere.')).toBeInTheDocument();
    expect(within(region).getByText('buttons-1')).toBeInTheDocument();
    expect(within(region).getByText('Never reached.')).toBeInTheDocument();
    expect(within(region).getByText('The start node is missing.')).toBeInTheDocument();
  });

  it('picks the node an issue is about, and offers no pick for graph-wide issues', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ValidationPanel issues={[UNREACHABLE, NO_START]} onPick={onPick} />);
    await user.click(screen.getByRole('button', { name: /Never reached\./ }));
    expect(onPick).toHaveBeenCalledWith('text-2');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByText('The start node is missing.').closest('li')).not.toBeNull();
  });

  it('lists an exact repeat twice', () => {
    renderWithProviders(<ValidationPanel issues={[DEAD, DEAD]} onPick={vi.fn()} />);
    expect(screen.getAllByText('Button "Yes" leads nowhere.')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('2 errors, 0 warnings');
  });
});

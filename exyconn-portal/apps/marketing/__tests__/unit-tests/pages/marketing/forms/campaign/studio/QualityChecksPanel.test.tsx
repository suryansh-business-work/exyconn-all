import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckSeverity } from '@exyconn/shell/graphql/generated';
import { QualityChecksPanel } from '../../../../../../../src/pages/marketing/forms/campaign/studio/QualityChecksPanel';
import { renderWithProviders } from '../../../../../test-utils';

const CHECKS = [
  { code: 'TIP', severity: CheckSeverity.Info, message: 'Add a preview text', line: null },
  { code: 'LINK', severity: CheckSeverity.Warning, message: 'A link has no https', line: 12 },
  { code: 'MJML', severity: CheckSeverity.Error, message: 'Unclosed mj-section', line: 4 },
  { code: 'SENDER', severity: CheckSeverity.Error, message: 'Sender is not verified' },
];

describe('QualityChecksPanel', () => {
  it('lists errors first, then warnings, then tips, with their lines', () => {
    renderWithProviders(
      <QualityChecksPanel checks={CHECKS} loading={false} error={null} onRun={vi.fn()} />,
    );
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Line 4: Unclosed mj-section',
      'Sender is not verified',
      'Line 12: A link has no https',
      'Add a preview text',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 problem(s) must be fixed before sending.',
    );
  });

  it('is ready to send when nothing is an error', () => {
    renderWithProviders(
      <QualityChecksPanel checks={[CHECKS[0]]} loading={false} error={null} onRun={vi.fn()} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Ready to send.');
  });

  it('is ready to send with no checks at all', () => {
    renderWithProviders(
      <QualityChecksPanel checks={[]} loading={false} error={null} onRun={vi.fn()} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Ready to send.');
  });

  it('shows a placeholder before the first run and no verdict', () => {
    const { container } = renderWithProviders(
      <QualityChecksPanel checks={null} loading error={null} onRun={vi.fn()} />,
    );
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run checks' })).toBeDisabled();
  });

  it('keeps the old results while re-running', () => {
    const { container } = renderWithProviders(
      <QualityChecksPanel checks={CHECKS} loading error={null} onRun={vi.fn()} />,
    );
    expect(container.querySelector('.MuiSkeleton-root')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('shows an error and runs the checks again on demand', async () => {
    const onRun = vi.fn();
    renderWithProviders(
      <QualityChecksPanel checks={null} loading={false} error="Timed out" onRun={onRun} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Timed out');
    await userEvent.click(screen.getByRole('button', { name: 'Run checks' }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });
});

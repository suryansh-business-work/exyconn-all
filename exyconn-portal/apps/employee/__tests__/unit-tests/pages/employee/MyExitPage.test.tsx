import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ExitStage, useMyExitRecordQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { formatMoney } from '@exyconn/shell/utils/money';
import { MyExitPage } from '../../../../src/pages/employee/MyExitPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyExitRecordQuery: vi.fn(),
}));

const exit = {
  id: 'x1',
  resignationDate: '2026-02-01',
  lastWorkingDate: '2026-03-31',
  noticePeriodDays: 60,
  reason: 'Relocating',
  stage: ExitStage.NoticePeriod,
  assetsReturned: true,
  knowledgeTransferDone: false,
  exitInterviewNotes: 'Would return',
  finalSettlementAmount: 85000,
  documentsIssued: false,
  daysToLastWorkingDay: 12,
};

/** The value written beside a DetailRow label. */
const valueOf = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('MyExitPage', () => {
  it('says it is loading before the record arrives', () => {
    vi.mocked(useMyExitRecordQuery).mockReturnValue(queryResult({ loading: true }));
    renderWithProviders(<MyExitPage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('No exit in progress.')).toBeNull();
  });

  it('says no exit is in progress when none has been opened', () => {
    vi.mocked(useMyExitRecordQuery).mockReturnValue(queryResult({ data: { myExitRecord: null } }));
    renderWithProviders(<MyExitPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Exit' })).toBeInTheDocument();
    expect(screen.getByText('No exit in progress.')).toBeInTheDocument();
  });

  it('summarises an exit: stage, dates, notice, checklist and settlement', () => {
    vi.mocked(useMyExitRecordQuery).mockReturnValue(queryResult({ data: { myExitRecord: exit } }));
    renderWithProviders(<MyExitPage />);

    expect(screen.getByRole('heading', { name: 'Your exit' })).toBeInTheDocument();
    expect(screen.getByText('Resigned on 2026-02-01')).toBeInTheDocument();
    expect(valueOf('Stage')).toBe('NOTICE PERIOD');
    expect(valueOf('Last working day')).toBe('on 2026-03-31');
    expect(valueOf('Days left')).toBe('12');
    expect(valueOf('Notice period')).toBe('60 days');
    expect(valueOf('Reason')).toBe('Relocating');
    expect(valueOf('Notes')).toBe('Would return');
    expect(valueOf('Assets returned')).toBe('Yes');
    expect(valueOf('Knowledge transfer')).toBe('No');
    expect(valueOf('Documents issued')).toBe('No');
    expect(valueOf('Final settlement')).toBe(formatMoney(85000));
  });

  it('says what is not agreed or settled yet instead of showing blanks', () => {
    vi.mocked(useMyExitRecordQuery).mockReturnValue(
      queryResult({
        data: {
          myExitRecord: {
            ...exit,
            lastWorkingDate: null,
            daysToLastWorkingDay: null,
            finalSettlementAmount: null,
            reason: '',
            exitInterviewNotes: '',
          },
        },
      }),
    );
    renderWithProviders(<MyExitPage />);

    expect(valueOf('Last working day')).toBe('Not agreed yet');
    expect(valueOf('Days left')).toBe('—');
    expect(valueOf('Reason')).toBe('—');
    expect(valueOf('Notes')).toBe('—');
    expect(valueOf('Final settlement')).toBe('Not settled yet');
  });
});

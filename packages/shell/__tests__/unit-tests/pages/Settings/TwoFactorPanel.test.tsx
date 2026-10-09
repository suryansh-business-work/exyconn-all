import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyMfaStatusQuery } from '@/graphql/generated';
import { TwoFactorPanel } from '@/pages/Settings/TwoFactorPanel';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useMyMfaStatusQuery: vi.fn(),
}));

interface StubProps {
  onEnrolled?: (codes: string[]) => void;
  onDisabled?: () => void;
  onCancel: () => void;
}

// The forms have their own tests; here they only report back the way the real ones do.
vi.mock('@/pages/Settings/forms/two-factor', () => ({
  TwoFactorForm: ({ onEnrolled, onCancel }: Readonly<StubProps>) => (
    <div>
      <span>enrol form</span>
      <button type="button" onClick={() => onEnrolled?.(['code-a', 'code-b'])}>
        enrolled
      </button>
      <button type="button" onClick={onCancel}>
        cancel enrol
      </button>
    </div>
  ),
  DisableTwoFactorForm: ({ onDisabled, onCancel }: Readonly<StubProps>) => (
    <div>
      <span>disable form</span>
      <button type="button" onClick={onDisabled}>
        disabled
      </button>
      <button type="button" onClick={onCancel}>
        cancel disable
      </button>
    </div>
  ),
}));

function mockStatus(status: unknown, extras = {}) {
  const result = queryResult(status && { myMfaStatus: status }, extras);
  vi.mocked(useMyMfaStatusQuery).mockReturnValue(result);
  return result;
}

describe('TwoFactorPanel', () => {
  it('offers set-up, disabled while the status loads, with no state chip yet', () => {
    mockStatus(undefined, { loading: true });
    renderWithProviders(<TwoFactorPanel />);
    expect(screen.getByRole('button', { name: 'Set up two-factor authentication' })).toBeDisabled();
    expect(screen.queryByText('Off')).toBeNull();
  });

  it('reports a status that could not load', () => {
    mockStatus(undefined, { error: new Error('MFA service down') });
    renderWithProviders(<TwoFactorPanel />);
    expect(screen.getByText('MFA service down')).toBeInTheDocument();
  });

  it('walks through enrolment, shows the recovery codes once and reloads the status', async () => {
    const result = mockStatus({ enabled: false, recoveryCodesLeft: 0 });
    renderWithProviders(<TwoFactorPanel />);
    expect(screen.getByText('Off')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Set up two-factor authentication' }));
    await userEvent.click(screen.getByRole('button', { name: 'enrolled' }));

    expect(
      screen.getByText('Save these now. They are shown once and cannot be shown again.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'code-a',
      'code-b',
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'I have saved them' }));
    expect(screen.queryByText('code-a')).toBeNull();
    expect(result.refetch).toHaveBeenCalledTimes(1);
  });

  it('goes back to the start when enrolment is cancelled', async () => {
    mockStatus({ enabled: false, recoveryCodesLeft: 0 });
    renderWithProviders(<TwoFactorPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Set up two-factor authentication' }));
    expect(screen.getByText('enrol form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'cancel enrol' }));

    expect(screen.queryByText('enrol form')).toBeNull();
    expect(screen.getByRole('button', { name: 'Set up two-factor authentication' })).toBeEnabled();
  });

  it('shows the codes left when on, and turns it off after the password', async () => {
    const result = mockStatus({ enabled: true, recoveryCodesLeft: 7 });
    renderWithProviders(<TwoFactorPanel />);

    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByText('7 recovery codes left.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    await userEvent.click(screen.getByRole('button', { name: 'cancel disable' }));
    expect(screen.queryByText('disable form')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    await userEvent.click(screen.getByRole('button', { name: 'disabled' }));
    expect(result.refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('disable form')).toBeNull();
  });
});

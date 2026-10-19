import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ICellRendererParams } from 'ag-grid-community';
import {
  EmailVerificationSource,
  EmailVerificationStatus,
  type EmailVerificationBadgeFragment,
} from '@exyconn/shell/graphql/generated';
import {
  EMAIL_STATUS_VIEW,
  EmailStatusBadge,
  emailColumn,
  useEmailCheck,
} from '../../../src/email-verification';
import { EmailCell, type EmailRow } from '../../../src/email-verification/EmailCell';
import { useVerifyEmail } from '../../../src/email-verification/useVerifyEmail';
import { renderHookWithProviders, renderWithProviders } from '../test-utils';

const mocked = vi.hoisted(() => ({ verify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useVerifyEmailMutation: () => [mocked.verify],
}));

function verification(
  overrides: Partial<EmailVerificationBadgeFragment> = {},
): EmailVerificationBadgeFragment {
  return {
    __typename: 'EmailVerification',
    id: 'ev-1',
    status: EmailVerificationStatus.Verified,
    reason: 'Mailbox exists',
    checkedAt: '2026-10-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('EmailStatusBadge', () => {
  it('shows a stored result as a focusable image with its reason', () => {
    renderWithProviders(<EmailStatusBadge verification={verification()} />);
    const chip = screen.getByRole('img', { name: /^Verified: Mailbox exists · checked / });
    expect(chip).toHaveAttribute('tabindex', '0');
  });

  it('falls back to the status label when the result has no reason', () => {
    renderWithProviders(
      <EmailStatusBadge
        verification={verification({ status: EmailVerificationStatus.Risky, reason: '' })}
      />,
    );
    expect(screen.getByRole('img', { name: /^Risky: Risky · checked / })).toBeInTheDocument();
  });

  it('offers a check on an address never checked', async () => {
    const onCheck = vi.fn();
    renderWithProviders(<EmailStatusBadge verification={null} onCheck={onCheck} />);
    const chip = screen.getByRole('button', {
      name: 'Not checked: Never checked. Click to check it now.',
    });
    await userEvent.click(chip);
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it('is only a status while checking or without a check action', () => {
    const { rerender } = renderWithProviders(
      <EmailStatusBadge verification={undefined} onCheck={vi.fn()} checking />,
    );
    expect(screen.getByRole('img', { name: /^Checking…:/ })).toBeInTheDocument();
    rerender(<EmailStatusBadge verification={undefined} />);
    expect(screen.getByRole('img', { name: /^Not checked:/ })).toBeInTheDocument();
  });

  it('has a look for every status', () => {
    expect(EMAIL_STATUS_VIEW[EmailVerificationStatus.Invalid].color).toBe('error');
    expect(EMAIL_STATUS_VIEW[EmailVerificationStatus.Unknown].label).toBe('Unknown');
  });
});

describe('useVerifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks the address as a CRM check and returns the result', async () => {
    const result = verification();
    mocked.verify.mockResolvedValue({ data: { verifyEmail: result } });
    const { result: hook } = renderHookWithProviders(() => useVerifyEmail());
    await expect(hook.current('a@b.io')).resolves.toBe(result);
    expect(mocked.verify).toHaveBeenCalledWith({
      variables: { email: 'a@b.io', source: EmailVerificationSource.Crm },
    });
  });

  it('is null when the server sent no result', async () => {
    mocked.verify.mockResolvedValue({ data: undefined });
    const { result: hook } = renderHookWithProviders(() => useVerifyEmail());
    await expect(hook.current('a@b.io')).resolves.toBeNull();
  });

  it('tells the person why the check failed and resolves to null', async () => {
    mocked.verify.mockRejectedValue(new Error('Quota reached'));
    renderWithProviders(<VerifyProbe email="a@b.io" />);
    await userEvent.click(screen.getByRole('button', { name: 'Probe' }));
    expect(await screen.findByText('Quota reached')).toBeInTheDocument();
    expect(screen.getByTestId('probe')).toHaveTextContent('null');
  });
});

function VerifyProbe({ email }: Readonly<{ email: string }>) {
  const verify = useVerifyEmail();
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          const target = event.currentTarget.nextElementSibling as HTMLElement;
          verify(email)
            .then((value) => {
              target.textContent = String(value);
            })
            .catch(() => undefined);
        }}
      >
        Probe
      </button>
      <output data-testid="probe" />
    </>
  );
}

describe('useEmailCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reloads the grid after a check that produced a result', async () => {
    mocked.verify.mockResolvedValue({ data: { verifyEmail: verification() } });
    const reload = vi.fn();
    const { result } = renderHookWithProviders(() => useEmailCheck(reload));
    await act(() => result.current('a@b.io'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload when the check could not run', async () => {
    mocked.verify.mockResolvedValue({ data: { verifyEmail: null } });
    const reload = vi.fn();
    const { result } = renderHookWithProviders(() => useEmailCheck(reload));
    await act(() => result.current('a@b.io'));
    expect(reload).not.toHaveBeenCalled();
  });
});

function cellParams(data: EmailRow | undefined, verifyEmail = vi.fn()) {
  return { data, context: { verifyEmail } } as unknown as ICellRendererParams<EmailRow>;
}

describe('EmailCell and emailColumn', () => {
  it('renders nothing for a row without an address', () => {
    const { container } = renderWithProviders(<EmailCell {...cellParams({ email: '' })} />);
    expect(container).toBeEmptyDOMElement();
    renderWithProviders(<EmailCell {...cellParams(undefined)} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('checks an unchecked address from the cell and shows progress meanwhile', async () => {
    let finish: () => void = () => undefined;
    const verifyEmail = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithProviders(<EmailCell {...cellParams({ email: 'a@b.io' }, verifyEmail)} />);
    expect(screen.getByText('a@b.io')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Not checked:/ }));
    expect(verifyEmail).toHaveBeenCalledWith('a@b.io');
    expect(screen.getByRole('img', { name: /^Checking…:/ })).toBeInTheDocument();
    await act(async () => finish());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Not checked:/ })).toBeInTheDocument(),
    );
  });

  it('shows the stored result of a checked address', () => {
    renderWithProviders(
      <EmailCell {...cellParams({ email: 'a@b.io', emailVerification: verification() })} />,
    );
    expect(screen.getByRole('img', { name: /^Verified:/ })).toBeInTheDocument();
  });

  it('builds a wide email column with the badge cell', () => {
    const column = emailColumn('Work email');
    expect(column).toMatchObject({ field: 'email', headerName: 'Work email', minWidth: 280 });
    expect(column.cellRenderer).toBe(EmailCell);
    expect(emailColumn().headerName).toBe('Email');
  });
});

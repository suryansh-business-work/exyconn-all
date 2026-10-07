import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QRCode from 'qrcode';
import { useConfirmMfaEnrolmentMutation, useStartMfaEnrolmentMutation } from '@/graphql/generated';
import { TwoFactorForm } from '@/pages/Settings/forms/two-factor';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useStartMfaEnrolmentMutation: vi.fn(),
  useConfirmMfaEnrolmentMutation: vi.fn(),
}));

// jsdom has no canvas, so the QR library's picture is stood in for.
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn() } }));

const QR_DATA = 'data:image/png;base64,QR';
const SECRET = ['JBSW', 'Y3DP'].join('');
const enrolment = { startMfaEnrolment: { secret: SECRET, uri: 'otpauth://totp/Exyconn' } };

const start = vi.fn();
const confirm = vi.fn();

function renderForm() {
  const onEnrolled = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(<TwoFactorForm onEnrolled={onEnrolled} onCancel={onCancel} />);
  return { onEnrolled, onCancel, ...view };
}

async function submitCode(code: string) {
  const input = screen.getByLabelText('Code from the app');
  await userEvent.clear(input);
  if (code) await userEvent.type(input, code);
  await userEvent.click(screen.getByRole('button', { name: 'Turn on' }));
}

beforeEach(() => {
  vi.mocked(QRCode.toDataURL)
    .mockReset()
    .mockResolvedValue(QR_DATA as never);
  start.mockReset().mockResolvedValue({ data: enrolment });
  confirm.mockReset().mockResolvedValue({ data: { confirmMfaEnrolment: ['r-1', 'r-2'] } });
  vi.mocked(useStartMfaEnrolmentMutation).mockReturnValue(mutationTuple(start) as never);
  vi.mocked(useConfirmMfaEnrolmentMutation).mockReturnValue(mutationTuple(confirm) as never);
});

describe('TwoFactorForm', () => {
  it('starts enrolment and draws the QR code in the browser, with the key as a fallback', async () => {
    renderForm();

    const qr = await screen.findByRole('img', { name: 'QR code for your authenticator app' });
    expect(qr).toHaveAttribute('src', QR_DATA);
    expect(screen.getByText(`Cannot scan? Enter this key by hand: ${SECRET}`)).toBeInTheDocument();
    expect(QRCode.toDataURL).toHaveBeenCalledWith('otpauth://totp/Exyconn', {
      margin: 1,
      width: 180,
    });
  });

  it('shows neither code nor key when the server returns no enrolment', async () => {
    start.mockResolvedValueOnce({ data: undefined });
    renderForm();

    await expect.poll(() => start.mock.calls.length).toBe(1);
    expect(screen.queryByRole('img')).toBeNull();
    expect(QRCode.toDataURL).not.toHaveBeenCalled();
  });

  it('ignores an enrolment that arrives after the form has closed', async () => {
    let finish: (value: unknown) => void = () => undefined;
    start.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { unmount } = renderForm();

    unmount();
    finish({ data: enrolment });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(QRCode.toDataURL).not.toHaveBeenCalled();
  });

  it('says so when set-up cannot start', async () => {
    start.mockRejectedValueOnce(new Error('MFA is switched off for this workspace'));
    renderForm();
    expect(await screen.findByText('MFA is switched off for this workspace')).toBeInTheDocument();
  });

  it('uses a generic message for a non-Error failure to start', async () => {
    start.mockRejectedValueOnce('offline');
    renderForm();
    expect(await screen.findByText('Two-factor setup could not be started.')).toBeInTheDocument();
  });

  it('asks for exactly six digits', async () => {
    renderForm();
    await submitCode('123');
    expect(await screen.findByText('Enter the six digits your app is showing')).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('turns two-factor on and hands back the recovery codes', async () => {
    const { onEnrolled } = renderForm();
    await submitCode('123456');

    await expect.poll(() => onEnrolled.mock.calls.length).toBe(1);
    expect(confirm).toHaveBeenCalledWith({ variables: { code: '123456' } });
    expect(onEnrolled).toHaveBeenCalledWith(['r-1', 'r-2']);
  });

  it('hands back no codes when the server returns none', async () => {
    confirm.mockResolvedValueOnce({ data: undefined });
    const { onEnrolled } = renderForm();
    await submitCode('123456');
    await expect.poll(() => onEnrolled.mock.calls.length).toBe(1);
    expect(onEnrolled).toHaveBeenCalledWith([]);
  });

  it('clears a refused code so the next one can be typed', async () => {
    confirm.mockRejectedValueOnce('nope');
    const { onEnrolled } = renderForm();
    await submitCode('654321');

    expect(await screen.findByText('That code was not accepted.')).toBeInTheDocument();
    expect(screen.getByLabelText('Code from the app')).toHaveValue('');
    expect(onEnrolled).not.toHaveBeenCalled();
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

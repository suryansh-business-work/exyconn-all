import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { clickAway } from '../../__tests__/helpers/toolHarness';
import QRCode from 'qrcode';
import { QR_SIZE_DEFAULT, buildReviewUrl, clampQrSize, buildQrOptions } from './utils';
import ReviewQRCode from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn(() => Promise.resolve()),
    toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,mock')),
  },
}));

const PLACE_ID = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
const EXPECTED_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`;

beforeEach(() => {
  vi.mocked(QRCode.toCanvas).mockClear();
  vi.mocked(QRCode.toDataURL).mockClear();
});

describe('review-qr-code utils', () => {
  describe('buildReviewUrl', () => {
    it('builds the Google review link from a place id', () => {
      expect(buildReviewUrl(PLACE_ID)).toBe(EXPECTED_URL);
    });
    it('trims surrounding whitespace', () => {
      expect(buildReviewUrl(`  ${PLACE_ID}  `)).toBe(EXPECTED_URL);
    });
    it('URL-encodes unsafe characters', () => {
      expect(buildReviewUrl('a b&c')).toBe('https://search.google.com/local/writereview?placeid=a%20b%26c');
    });
    it('returns an empty string for blank input', () => {
      expect(buildReviewUrl('   ')).toBe('');
    });
  });

  describe('clampQrSize', () => {
    it('keeps values inside the range', () => expect(clampQrSize(500)).toBe(500));
    it('clamps below the minimum', () => expect(clampQrSize(50)).toBe(200));
    it('clamps above the maximum', () => expect(clampQrSize(5000)).toBe(1000));
    it('rounds fractional values', () => expect(clampQrSize(300.6)).toBe(301));
    it('falls back to the default for NaN', () => expect(clampQrSize(Number.NaN)).toBe(QR_SIZE_DEFAULT));
  });

  describe('buildQrOptions', () => {
    it('uses error-correction level M and maps colors', () => {
      expect(buildQrOptions({ size: 400, fgColor: '#111111', bgColor: '#eeeeee' })).toEqual({
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#111111', light: '#eeeeee' },
      });
    });
    it('clamps the requested size', () => {
      expect(buildQrOptions({ size: 9999, fgColor: '#000000', bgColor: '#ffffff' }).width).toBe(1000);
    });
  });
});

describe('ReviewQRCode component', () => {
  const generate = () => {
    fireEvent.change(screen.getByLabelText(/Google Place ID/i), { target: { value: PLACE_ID } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate QR Code' }));
  };

  it('renders the form with a disabled generate button', () => {
    render(<ReviewQRCode />);
    expect(screen.getByRole('heading', { name: 'Review QR Code Generator' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Google Place ID/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate QR Code' })).toBeDisabled();
  });

  it('renders a real QR code onto the canvas for the built link', async () => {
    render(<ReviewQRCode />);
    generate();
    await waitFor(() => expect(QRCode.toCanvas).toHaveBeenCalled());
    const [canvas, text, options] = vi.mocked(QRCode.toCanvas).mock.calls[0] as unknown as [
      HTMLCanvasElement,
      string,
      { errorCorrectionLevel: string },
    ];
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(text).toBe(EXPECTED_URL);
    expect(options.errorCorrectionLevel).toBe('M');
    expect(screen.getByText(EXPECTED_URL)).toBeInTheDocument();
  });

  it('downloads the QR code as a PNG', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<ReviewQRCode />);
    generate();
    fireEvent.click(await screen.findByRole('button', { name: 'Download PNG' }));
    await waitFor(() =>
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        EXPECTED_URL,
        expect.objectContaining({ errorCorrectionLevel: 'M' })
      )
    );
    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    clickSpy.mockRestore();
  });

  it('copies the review link to the clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<ReviewQRCode />);
    generate();
    fireEvent.click(await screen.findByRole('button', { name: 'Copy Link' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(EXPECTED_URL));
    expect(await screen.findByText('Link copied to clipboard')).toBeInTheDocument();
  });

  it('shows an error when QR rendering fails', async () => {
    vi.mocked(QRCode.toCanvas).mockImplementationOnce(() => Promise.reject(new Error('render failed')));
    render(<ReviewQRCode />);
    generate();
    expect(await screen.findByText('Failed to render the QR code.')).toBeInTheDocument();
  });

  it('re-renders the QR code with the new size and colours', async () => {
    render(<ReviewQRCode />);
    generate();
    await waitFor(() => expect(QRCode.toCanvas).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByRole('slider', { name: 'QR code size' }), { target: { value: 500 } });
    fireEvent.change(screen.getByLabelText('Foreground color'), { target: { value: '#112233' } });
    fireEvent.change(screen.getByLabelText('Background color'), { target: { value: '#ffeedd' } });
    await waitFor(() => {
      const last = vi.mocked(QRCode.toCanvas).mock.calls.at(-1) as unknown as [
        HTMLCanvasElement,
        string,
        { width: number; color: { dark: string; light: string } },
      ];
      expect(last[2].width).toBe(500);
      expect(last[2].color).toEqual({ dark: '#112233', light: '#ffeedd' });
    });
    expect(screen.getByText('Size: 500px')).toBeInTheDocument();
    expect(screen.getByText('#112233')).toBeInTheDocument();
  });

  it('shows an error when exporting the PNG fails', async () => {
    vi.mocked(QRCode.toDataURL).mockImplementationOnce(() => Promise.reject(new Error('no export')));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<ReviewQRCode />);
    generate();
    fireEvent.click(await screen.findByRole('button', { name: 'Download PNG' }));
    expect(await screen.findByText('Failed to export the QR code.')).toBeInTheDocument();
    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('shows an error when the clipboard is unavailable', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: vi.fn(() => Promise.reject(new Error('denied'))) },
      configurable: true,
    });
    render(<ReviewQRCode />);
    generate();
    fireEvent.click(await screen.findByRole('button', { name: 'Copy Link' }));
    expect(await screen.findByText('Could not copy the link to the clipboard.')).toBeInTheDocument();
    expect(screen.queryByText('Link copied to clipboard')).toBeNull();
  });

  it('dismisses the error notice with its close button and by clicking away', async () => {
    vi.mocked(QRCode.toCanvas).mockImplementationOnce(() => Promise.reject(new Error('x')));
    render(<ReviewQRCode />);
    generate();
    await screen.findByText('Failed to render the QR code.');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Failed to render the QR code.')).toBeNull());

    vi.mocked(QRCode.toCanvas).mockImplementationOnce(() => Promise.reject(new Error('y')));
    fireEvent.change(screen.getByLabelText('Foreground color'), { target: { value: '#123456' } });
    await screen.findByText('Failed to render the QR code.');
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Failed to render the QR code.')).toBeNull());
  });

  it('dismisses the copied notice with its close button and by clicking away', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: vi.fn(() => Promise.resolve()) },
      configurable: true,
    });
    render(<ReviewQRCode />);
    generate();
    fireEvent.click(await screen.findByRole('button', { name: 'Copy Link' }));
    await screen.findByText('Link copied to clipboard');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Link copied to clipboard')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }));
    await screen.findByText('Link copied to clipboard');
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Link copied to clipboard')).toBeNull());
  });
});

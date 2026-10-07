import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Linking } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { ConsentBody } from '../../../../src/components/consent/ConsentBody';
import { HEIGHT_REPORTER } from '../../../../src/lib/consent/consent-document';
import { webViewTest } from '../../mocks/react-native-webview';
import { renderWithProviders } from '../../test-utils';

const HTML = '<p>We record your working time.</p>';

function view() {
  const props = webViewTest.last();
  if (props === undefined) {
    throw new Error('The web view never rendered.');
  }
  return props;
}

function navigate(url: string): boolean | undefined {
  return view().onShouldStartLoadWithRequest?.({ url });
}

function heightOf(): unknown {
  return (view().style as { height?: number } | undefined)?.height;
}

describe('ConsentBody', () => {
  it('renders the admin’s disclosure verbatim inside the locked-down document', () => {
    renderWithProviders(<ConsentBody html={HTML} />);
    expect(screen.getByRole('document', { name: 'Monitoring disclosure' })).toBeInTheDocument();
    const html = (view().source as { html: string }).html;
    expect(html).toContain(HTML);
    expect(html).toContain('Content-Security-Policy');
  });

  it('runs nothing but its own height reporter, with every escape hatch shut', () => {
    renderWithProviders(<ConsentBody html={HTML} />);
    const props = view();
    expect(props.injectedJavaScript).toBe(HEIGHT_REPORTER);
    expect(props.originWhitelist).toEqual(['*']);
    expect(props.javaScriptCanOpenWindowsAutomatically).toBe(false);
    expect(props.allowFileAccess).toBe(false);
    expect(props.domStorageEnabled).toBe(false);
    expect(props.setSupportMultipleWindows).toBe(false);
  });

  it('stays on its own document, anchors included', () => {
    renderWithProviders(<ConsentBody html={HTML} />);
    expect(navigate('about:blank')).toBe(true);
    expect(navigate('about:blank#section-2')).toBe(true);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('blocks a link the reader did not tap, such as a meta refresh', () => {
    renderWithProviders(<ConsentBody html={HTML} />);
    expect(navigate('https://example.test/policy')).toBe(false);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('opens a tapped web link in the system browser instead of the web view', () => {
    renderWithProviders(<ConsentBody html={HTML} />);
    fireEvent.touchStart(screen.getByTestId('webview'));
    expect(navigate('https://example.test/policy')).toBe(false);
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.test/policy');
  });

  it('never hands a tapped link of another scheme to the phone', () => {
    renderWithProviders(<ConsentBody html={HTML} />);
    fireEvent.touchStart(screen.getByTestId('webview'));
    expect(navigate('intent://settings')).toBe(false);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('treats a tap from long ago as no tap at all', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(10_000);
    renderWithProviders(<ConsentBody html={HTML} />);
    fireEvent.touchStart(screen.getByTestId('webview'));
    now.mockReturnValue(12_000);
    expect(navigate('https://example.test/policy')).toBe(false);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('logs a link the phone could not open', async () => {
    const failure = new Error('no browser');
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(Linking.openURL).mockRejectedValueOnce(failure);
    renderWithProviders(<ConsentBody html={HTML} />);
    fireEvent.touchStart(screen.getByTestId('webview'));
    navigate('mailto:hr@example.test');
    await waitFor(() =>
      expect(log).toHaveBeenCalledWith('Opening a disclosure link failed', failure),
    );
  });

  it('starts a line tall and grows to the height the page reports', () => {
    renderWithProviders(<ConsentBody html={HTML} />);
    expect(heightOf()).toBe(48);
    act(() => {
      view().onMessage?.({ nativeEvent: { data: '640' } });
    });
    expect(heightOf()).toBe(640);
  });

  it('ignores a message that is not a height', () => {
    renderWithProviders(<ConsentBody html={HTML} />);
    act(() => {
      view().onMessage?.({ nativeEvent: { data: 'hello' } });
    });
    expect(heightOf()).toBe(48);
  });
});

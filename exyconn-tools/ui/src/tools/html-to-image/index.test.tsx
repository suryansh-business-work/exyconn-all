import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import {
  captureNode, clampDimension, outputFileName, stripScripts, MAX_DIMENSION,
} from './utils';
import HtmlToImage from './index';

vi.mock('html-to-image', () => ({
  toPng: vi.fn(async () => 'data:image/png;base64,png'),
  toJpeg: vi.fn(async () => 'data:image/jpeg;base64,jpg'),
  toSvg: vi.fn(async () => 'data:image/svg+xml;base64,svg'),
}));

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

describe('html-to-image utils', () => {
  describe('stripScripts', () => {
    it('removes a script block including its content', () => {
      expect(stripScripts('<p>a</p><script>alert(1)</script><p>b</p>')).toBe('<p>a</p><p>b</p>');
    });
    it('removes script tags with attributes', () => {
      expect(stripScripts('<div>x</div><script src="evil.js" defer></script>')).toBe('<div>x</div>');
    });
    it('is case-insensitive', () => {
      expect(stripScripts('<SCRIPT>alert(1)</SCRIPT>ok')).toBe('ok');
    });
    it('removes an unclosed script tag', () => {
      expect(stripScripts('<div>hi</div><script src="x">')).toBe('<div>hi</div>');
    });
    it('removes multiple script blocks', () => {
      expect(stripScripts('<script>a()</script><b>keep</b><script>b()</script>')).toBe('<b>keep</b>');
    });
    it('preserves style tags and other markup', () => {
      const html = '<style>p{color:red}</style><p class="x">hi</p>';
      expect(stripScripts(html)).toBe(html);
    });
  });

  describe('clampDimension', () => {
    it('rounds valid values', () => expect(clampDimension(99.6)).toBe(100));
    it('clamps below 1', () => expect(clampDimension(-5)).toBe(1));
    it('clamps above the maximum', () => expect(clampDimension(999999)).toBe(MAX_DIMENSION));
    it('falls back to 1 for NaN', () => expect(clampDimension(Number.NaN)).toBe(1));
  });

  describe('outputFileName', () => {
    it('uses jpg for jpeg', () => expect(outputFileName('jpeg')).toBe('html-snippet.jpg'));
    it('uses png for png', () => expect(outputFileName('png')).toBe('html-snippet.png'));
    it('uses svg for svg', () => expect(outputFileName('svg')).toBe('html-snippet.svg'));
  });

  describe('captureNode', () => {
    const node = document.createElement('div');
    it('calls toPng with the size and pixel ratio', async () => {
      const url = await captureNode(node, { format: 'png', width: 100, height: 50, scale: 2 });
      expect(url).toBe('data:image/png;base64,png');
      expect(toPng).toHaveBeenCalledWith(node, { width: 100, height: 50, pixelRatio: 2 });
    });
    it('calls toJpeg with a white background and quality', async () => {
      await captureNode(node, { format: 'jpeg', width: 100, height: 50, scale: 1 });
      expect(toJpeg).toHaveBeenCalledWith(node, {
        width: 100, height: 50, pixelRatio: 1, quality: 0.95, backgroundColor: '#ffffff',
      });
    });
    it('calls toSvg for svg output', async () => {
      const url = await captureNode(node, { format: 'svg', width: 10, height: 10, scale: 3 });
      expect(url).toBe('data:image/svg+xml;base64,svg');
      expect(toSvg).toHaveBeenCalledWith(node, { width: 10, height: 10, pixelRatio: 3 });
    });
  });
});

describe('HtmlToImage component', () => {
  it('renders the editor and options', () => {
    render(<HtmlToImage />);
    expect(screen.getByText('HTML to Image')).toBeInTheDocument();
    expect(screen.getByLabelText(/HTML snippet/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Width \(px\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Height \(px\)/)).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('JPEG')).toBeInTheDocument();
    expect(screen.getByText('SVG')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Render Preview' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generate Image' })).toBeDisabled();
    expect(screen.getByText(/processed locally\s+in your browser/)).toBeInTheDocument();
  });

  it('renders a sanitized preview from the snippet', () => {
    render(<HtmlToImage />);
    fireEvent.change(screen.getByLabelText(/HTML snippet/), {
      target: { value: '<p>Hello preview</p><script>bad()</script>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Render Preview' }));
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Hello preview')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByRole('button', { name: 'Generate Image' })).toBeEnabled();
  });
});

import { describe, expect, it } from 'vitest';
import { mailDocument, prepareMailHtml } from '../../../../src/pages/mail/reader/mailHtml';

const HTML =
  '<p onclick="steal()">Hi<script>alert(1)</script></p><img src="https://track.example/p.gif" alt="logo"><a href="https://acme.io">Acme</a>';

describe('prepareMailHtml', () => {
  it('drops scripts and handlers, hides remote images and opens links in a new tab', () => {
    const { html, images } = prepareMailHtml(HTML, false);
    expect(images).toBe(1);
    expect(html).not.toMatch(/script|onclick|track\.example/);
    expect(html).toContain('<a href="https://acme.io" target="_blank" rel="noopener noreferrer">');
  });

  it('keeps the images once the person chose to show them', () => {
    expect(prepareMailHtml(HTML, true).html).toContain('src="https://track.example/p.gif"');
  });
});

describe('mailDocument', () => {
  const style = { font: 'Inter', ink: '#000', paper: '#fff', link: '#00f' };

  it('allows no script or request, and remote images only once shown', () => {
    expect(mailDocument('<p>x</p>', style, false)).toContain(
      "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
    );
    expect(mailDocument('<p>x</p>', style, true)).toContain('img-src https: data:');
  });
});

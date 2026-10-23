import { describe, expect, it } from 'vitest';
import { mailDocument, prepareMailHtml } from '../../../../src/pages/mail/reader/mailHtml';

const HTML =
  '<p onclick="steal()">Hi<script>alert(1)</script></p><img src="https://track.example/p.gif" alt="logo"><a href="https://acme.io">Acme</a>';

describe('prepareMailHtml', () => {
  it('drops scripts and handlers, keeps the images and opens links in a new tab', () => {
    const html = prepareMailHtml(HTML);
    expect(html).not.toMatch(/script|onclick/);
    expect(html).toContain('src="https://track.example/p.gif"');
    expect(html).toContain('<a href="https://acme.io" target="_blank" rel="noopener noreferrer">');
  });
});

describe('mailDocument', () => {
  const style = { font: 'Inter', ink: '#000', paper: '#fff', link: '#00f' };

  it('allows no script or request but images', () => {
    expect(mailDocument('<p>x</p>', style)).toContain(
      "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'",
    );
  });
});

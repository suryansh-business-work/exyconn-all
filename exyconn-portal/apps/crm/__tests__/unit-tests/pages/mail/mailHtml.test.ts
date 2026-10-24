import { describe, expect, it } from 'vitest';
import { mailDocument, prepareMailHtml } from '../../../../src/pages/mail/reader/mailHtml';

const HTML =
  '<p onclick="steal()">Hi<script>alert(1)</script></p><img src="https://track.example/p.gif" alt="logo"><a href="https://acme.io">Acme</a>';

describe('prepareMailHtml', () => {
  it('drops scripts and handlers, keeps the images and opens links in a new tab', () => {
    const { main, quoted } = prepareMailHtml(HTML);
    expect(main).not.toMatch(/script|onclick/);
    expect(main).toContain('src="https://track.example/p.gif"');
    expect(main).toContain('<a href="https://acme.io" target="_blank" rel="noopener noreferrer">');
    expect(quoted).toBe('');
  });

  it("folds Gmail's and Outlook's quoted mail away from the reply", () => {
    const gmail = prepareMailHtml('<p>Thanks!</p><div class="gmail_quote"><p>Earlier</p></div>');
    expect(gmail.main).toBe('<p>Thanks!</p>');
    expect(gmail.quoted).toContain('Earlier');

    const outlook = prepareMailHtml(
      '<p>Sure</p><div id="divRplyFwdMsg">From: Asha</div><p>Original</p>',
    );
    expect(outlook.main).toBe('<p>Sure</p>');
    expect(outlook.quoted).toContain('From: Asha');
    expect(outlook.quoted).toContain('Original');
  });

  it('keeps a message that is nothing but quote whole', () => {
    const only = '<blockquote type="cite"><p>Forwarded text</p></blockquote>';
    expect(prepareMailHtml(only)).toEqual({ main: only, quoted: '' });
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

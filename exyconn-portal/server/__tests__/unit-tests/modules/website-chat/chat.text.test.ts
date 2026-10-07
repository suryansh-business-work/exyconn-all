import { chunk, htmlToText, titleOf } from '../../../../src/modules/website-chat/chat.text';

describe('htmlToText', () => {
  it('keeps the readable text and drops page chrome with its contents', () => {
    const html = [
      '<html><head><title>Ignored</title><style>p{color:red}</style></head>',
      '<body><header>Menu</header><nav>Links</nav>',
      '<main><h1>Pricing</h1>',
      '<p>Plans   start\n   at $10.</p><script>alert(1)</script></main>',
      '<form>Sign up</form><footer>Copyright</footer></body></html>',
    ].join('\n');
    expect(htmlToText(html)).toBe('Pricing Plans start at $10.');
  });

  it('decodes the entities the sanitizer writes back', () => {
    expect(htmlToText('<p>Fish &amp; chips&nbsp;&lt;3 &quot;yes&quot; it&#39;s</p>')).toBe(
      `Fish & chips <3 "yes" it's`,
    );
  });

  it('is empty for markup with no text', () => {
    expect(htmlToText('<div>  <br/> </div>')).toBe('');
  });
});

describe('titleOf', () => {
  it("reads the page's title as text", () => {
    expect(titleOf('<head><title lang="en"> Careers &amp; jobs </title></head>')).toBe(
      'Careers & jobs',
    );
  });

  it('is empty when the page has no title', () => {
    expect(titleOf('<p>No title here</p>')).toBe('');
  });
});

describe('chunk', () => {
  it('keeps short text in one piece', () => {
    expect(chunk('one two', 20, 4)).toEqual(['one two']);
  });

  it('breaks between words near the size', () => {
    expect(chunk('alpha beta gamma delta', 12, 4)).toEqual(['alpha beta', 'gamma delta']);
  });

  it('cuts mid-word when the nearest space is in the first half', () => {
    expect(chunk('ab cdefghijklmnop', 8, 4)).toEqual(['ab cdefg', 'hijklmno', 'p']);
  });

  it('stops at the most pieces allowed', () => {
    expect(chunk('aaaa bbbb cccc dddd', 5, 2)).toEqual(['aaaa', 'bbbb']);
  });

  it('is empty for empty text', () => {
    expect(chunk('', 10, 3)).toEqual([]);
  });
});

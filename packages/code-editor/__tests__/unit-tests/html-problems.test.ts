import { htmlProblems } from '../../src/html-problems';

const error = (line: number, column: number, message: string) => ({
  line,
  column,
  message,
  severity: 'error',
});

describe('htmlProblems', () => {
  it('finds nothing in balanced markup, void and self-closing elements and comments', () => {
    const html = [
      '<!DOCTYPE html>',
      '<div class="card">',
      '  <!-- <span> inside a comment is ignored -->',
      '  <img src="a.png" alt="">',
      '  <br><hr/>',
      '  <mj-image src="b.png" />',
      '  <P>Mixed <b>case</B></p>',
      '</div>',
    ].join('\n');
    expect(htmlProblems(html)).toEqual([]);
    expect(htmlProblems('')).toEqual([]);
  });

  it('reports a closing tag nothing opened', () => {
    expect(htmlProblems('<p>text</p></div>')).toEqual([
      error(1, 12, '</div> closes an element that was never opened'),
    ]);
  });

  it('reports the elements a closing tag shuts early, at their own position', () => {
    expect(htmlProblems('<div>\n  <span><b>x\n</div>')).toEqual([
      error(2, 3, '<span> is not closed before </div>'),
      error(2, 9, '<b> is not closed before </div>'),
    ]);
  });

  it('pairs a closing tag with the innermost element of that name', () => {
    expect(htmlProblems('<div><div><p></div></div>')).toEqual([
      error(1, 11, '<p> is not closed before </div>'),
    ]);
  });

  it('reports elements left open, sorted by where they start', () => {
    expect(htmlProblems('<section>\n<ul>\n  <li>one')).toEqual([
      error(1, 1, '<section> is not closed'),
      error(2, 1, '<ul> is not closed'),
      error(3, 3, '<li> is not closed'),
    ]);
  });

  it('skips the content of raw-text elements up to their closing tag', () => {
    const html = '<style>p > a { color: red }</style><script>if (a < b) { x("</p>") }</SCRIPT>';
    expect(htmlProblems(html)).toEqual([]);
    expect(htmlProblems('<title><b></title>')).toEqual([]);
  });

  it('stops at a raw-text element that never closes, still reporting what is open', () => {
    expect(htmlProblems('<div>\n<script>let a = "<p>";')).toEqual([
      error(1, 1, '<div> is not closed'),
      error(2, 1, '<script> is not closed'),
    ]);
  });

  it('gives the same answer when run twice on the same text', () => {
    const html = '<div><span></div>';
    expect(htmlProblems(html)).toEqual(htmlProblems(html));
  });
});

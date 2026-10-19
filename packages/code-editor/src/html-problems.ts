import type { CodeProblem } from './types';

/** Elements that never have a closing tag. */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** Elements whose content is text, not markup: everything up to their closing tag is skipped. */
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

/** A comment, or an opening/closing/self-closing tag with its name. */
const TOKEN = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:.-]*)(?:\s[^<>]*?)?(\/?)>/g;

interface OpenTag {
  name: string;
  index: number;
}

/** Where the innermost open `name` is on the stack, or -1. */
function lastOpen(open: readonly OpenTag[], name: string): number {
  for (let i = open.length - 1; i >= 0; i -= 1) {
    if (open[i].name === name) return i;
  }
  return -1;
}

/** Turns a character offset into a 1-based line and column. */
function locator(text: string): (index: number) => { line: number; column: number } {
  const starts = [0];
  for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) {
    starts.push(i + 1);
  }
  return (index) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (starts[mid] <= index) low = mid;
      else high = mid - 1;
    }
    return { line: low + 1, column: index - starts[low] + 1 };
  };
}

type Report = (index: number, message: string) => void;

/** Closes the innermost open `name`, reporting a stray closing tag or what it closes early. */
function closeTag(open: OpenTag[], name: string, index: number, report: Report): void {
  const depth = lastOpen(open, name);
  if (depth < 0) {
    report(index, `</${name}> closes an element that was never opened`);
    return;
  }
  for (const unclosed of open.splice(depth).slice(1)) {
    report(unclosed.index, `<${unclosed.name}> is not closed before </${name}>`);
  }
}

/**
 * Tags that do not pair up in an HTML or MJML snippet: a closing tag nothing opened, one that
 * closes the wrong element, and elements left open. Monaco has no HTML diagnostics of its own.
 */
export function htmlProblems(text: string): CodeProblem[] {
  const at = locator(text);
  const lower = text.toLowerCase();
  const problems: CodeProblem[] = [];
  const report: Report = (index, message) => {
    problems.push({ ...at(index), message, severity: 'error' });
  };
  const open: OpenTag[] = [];

  TOKEN.lastIndex = 0;
  for (let match = TOKEN.exec(text); match; match = TOKEN.exec(text)) {
    const [whole, closing, rawName, selfClosing] = match;
    if (rawName === undefined) continue;
    const name = rawName.toLowerCase();
    if (closing) {
      closeTag(open, name, match.index, report);
      continue;
    }
    if (selfClosing || VOID_ELEMENTS.has(name)) continue;
    if (RAW_TEXT.has(name)) {
      // Raw text runs to its closing tag; the scan resumes there.
      const end = lower.indexOf(`</${name}`, match.index + whole.length);
      if (end < 0) {
        report(match.index, `<${name}> is not closed`);
        break;
      }
      TOKEN.lastIndex = end;
    }
    open.push({ name, index: match.index });
  }
  for (const unclosed of open) {
    report(unclosed.index, `<${unclosed.name}> is not closed`);
  }
  return problems.sort((a, b) => a.line - b.line || a.column - b.column);
}

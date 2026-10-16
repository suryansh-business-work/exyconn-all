import { describe, expect, it } from 'vitest';
import { parseCsv } from '../src/csv';

describe('parseCsv', () => {
  it('reads comma rows with CRLF, LF and CR line ends', () => {
    expect(parseCsv('a,b\r\n1,2\n3,4\r5,6')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ]);
  });

  it('keeps delimiters, line breaks and doubled quotes inside a quoted field', () => {
    expect(parseCsv('name,note\n"Smith, J","said ""hi""\nthen left"')).toEqual([
      ['name', 'note'],
      ['Smith, J', 'said "hi"\nthen left'],
    ]);
  });

  it('reads an unterminated quote to the end of the file', () => {
    expect(parseCsv('a\n"open')).toEqual([['a'], ['open']]);
  });

  it('reads a doubled quote at the very end of the file', () => {
    expect(parseCsv('a\n"x""')).toEqual([['a'], ['x"']]);
  });

  it('drops a BOM and blank lines at the end', () => {
    expect(parseCsv('﻿a,b\n1,2\n\n\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('detects semicolon and tab delimiters from the header', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(parseCsv('a\tb\n1\t2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('reads a one-column file and an empty one', () => {
    expect(parseCsv('only')).toEqual([['only']]);
    expect(parseCsv('')).toEqual([]);
  });

  it('keeps a trailing empty cell', () => {
    expect(parseCsv('a,b\n1,')).toEqual([
      ['a', 'b'],
      ['1', ''],
    ]);
  });
});

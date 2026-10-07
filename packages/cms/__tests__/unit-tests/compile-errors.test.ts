import { describe, it, expect } from 'vitest';
import { compileHtml, CmsCompileError } from '../../src/compile';

const compile = (html: string) => compileHtml(html, '');

function errorOf(html: string): CmsCompileError {
  try {
    compile(html);
  } catch (error) {
    if (error instanceof CmsCompileError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected compileHtml to throw');
}

describe('CmsCompileError', () => {
  it('is an Error named CmsCompileError carrying the message', () => {
    const error = new CmsCompileError('where it broke');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CmsCompileError');
    expect(error.message).toBe('where it broke');
  });
});

describe('compileHtml: malformed placeholders', () => {
  it('rejects a component without a key, or with an empty key', () => {
    expect(() => compile('<exy-component></exy-component>')).toThrow(CmsCompileError);
    expect(errorOf('<exy-component data-key=""/>').message).toBe(
      'A component has no component selected.',
    );
  });

  it('rejects props that are not JSON', () => {
    expect(errorOf(`<exy-component data-key="a" data-props='{oops'/>`).message).toBe(
      'The settings of component "a" are not valid JSON.',
    );
  });

  it.each(['null', '42', '"text"', 'true', '[1,2]'])('rejects props that are %s', (props) => {
    expect(errorOf(`<exy-component data-key="a" data-props='${props}'/>`).message).toBe(
      'The settings of component "a" must be an object.',
    );
  });

  it('rejects a closing tag that was never opened', () => {
    expect(errorOf('<p>x</p></exy-component>').message).toBe(
      'A component is closed that was never opened.',
    );
  });

  it('names the innermost component that is never closed', () => {
    expect(() => compile('<exy-component data-key="outer">')).toThrow(CmsCompileError);
    const html = '<exy-component data-key="outer"><exy-component data-key="inner"></exy-component>';
    expect(errorOf(html).message).toBe('Component "outer" is never closed.');
    expect(errorOf('<exy-component data-key="a"><exy-component data-key="b">').message).toBe(
      'Component "b" is never closed.',
    );
  });

  it('rejects a fragment without a fragment id', () => {
    expect(errorOf('<exy-fragment></exy-fragment>').message).toBe(
      'A fragment has no fragment selected.',
    );
    expect(() => compile(`<exy-fragment data-fragment-id=''/>`)).toThrow(CmsCompileError);
  });
});

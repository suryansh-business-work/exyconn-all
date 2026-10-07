import { describe, it, expect } from 'vitest';
import * as cms from '../../src';
import * as blocks from '../../src/blocks';
import * as compile from '../../src/compile';
import * as catalogue from '../../src/catalogue';

describe('@exyconn/cms entry point', () => {
  it('re-exports the blocks, the compiler and the catalogue', () => {
    for (const module of [blocks, compile, catalogue]) {
      for (const [name, value] of Object.entries(module)) {
        expect(cms).toHaveProperty(name, value);
      }
    }
  });

  it('exports nothing beyond those three modules', () => {
    const names = [blocks, compile, catalogue].flatMap((module) => Object.keys(module));
    expect(Object.keys(cms).sort((a, b) => a.localeCompare(b))).toEqual(
      names.sort((a, b) => a.localeCompare(b)),
    );
  });

  it('wires the public API together end to end', () => {
    const hero = cms.cmsComponent('home.hero');
    expect(hero?.key).toBe('home.hero');
    const html = `<main>${cms.componentPlaceholder('home.hero', {})}${cms.fragmentPlaceholder('f')}</main>`;
    const compiled = cms.compileHtml(html, 'main{}');
    expect(compiled.css).toBe('main{}');
    expect(cms.fragmentIdsOf(compiled.blocks)).toEqual(['f']);
    expect(compiled.blocks.map((block) => block.kind)).toEqual([
      'html',
      'component',
      'fragment',
      'html',
    ]);
  });
});

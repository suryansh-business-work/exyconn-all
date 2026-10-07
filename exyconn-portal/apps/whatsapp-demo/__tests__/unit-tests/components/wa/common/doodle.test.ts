import { describe, expect, it } from 'vitest';
import { doodleTile } from '../../../../../src/components/wa/common/doodle';

const PREFIX = 'url("data:image/svg+xml,';

function svgOf(tile: string): string {
  return decodeURIComponent(tile.slice(PREFIX.length, -2));
}

describe('doodleTile', () => {
  it('is a CSS url() holding an encoded SVG data URI', () => {
    const tile = doodleTile('#123456');
    expect(tile.startsWith(PREFIX)).toBe(true);
    expect(tile.endsWith('")')).toBe(true);
    expect(tile).not.toContain('<');
  });

  it('draws every shape as an outline in the given colour', () => {
    const svg = svgOf(doodleTile('#abcdef'));
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="200"')).toBe(
      true,
    );
    const paths = svg.match(/<path /g) ?? [];
    expect(paths).toHaveLength(11);
    expect(svg.split('stroke="#abcdef"')).toHaveLength(12);
    expect(svg).toContain('fill="none"');
  });

  it('changes only the stroke between palettes', () => {
    const light = svgOf(doodleTile('#111111'));
    const dark = svgOf(doodleTile('#eeeeee'));
    expect(light.replaceAll('#111111', '#eeeeee')).toBe(dark);
  });
});

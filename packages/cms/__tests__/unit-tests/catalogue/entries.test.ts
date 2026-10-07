import { describe, it, expect } from 'vitest';
import { CMS_COMPONENTS } from '../../../src/catalogue';
import { compileHtml, componentPlaceholder } from '../../../src/compile';

/** The paths in a props value that the editing form could not render (not a field, list or group). */
function invalidLeaves(value: unknown, path: string): string[] {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return typeof value === 'number' && !Number.isFinite(value) ? [path] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => invalidLeaves(item, `${path}[${index}]`));
  }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.entries(value).flatMap(([key, item]) => invalidLeaves(item, `${path}.${key}`));
  }
  return [path];
}

const ENTRIES = CMS_COMPONENTS.map((component) => [component.key, component] as const);

describe.each(ENTRIES)('catalogue entry %s', (key, component) => {
  it('has a label, a category and a description', () => {
    for (const text of [component.label, component.category, component.description]) {
      expect(typeof text).toBe('string');
      expect(text.trim()).not.toBe('');
      expect(text).toBe(text.trim());
    }
  });

  it('has plain-object default props made only of fields, lists and groups', () => {
    expect(Object.getPrototypeOf(component.defaultProps)).toBe(Object.prototype);
    expect(invalidLeaves(component.defaultProps, key)).toEqual([]);
  });

  it('marks containers with a boolean flag', () => {
    expect(['undefined', 'boolean']).toContain(typeof component.acceptsChildren);
  });

  it('survives the editor round trip: placeholder in, identical props out', () => {
    const html = componentPlaceholder(key, component.defaultProps);
    expect(compileHtml(html, '').blocks).toEqual([
      { kind: 'component', key, props: component.defaultProps, children: [] },
    ]);
  });
});

describe('catalogue containers', () => {
  it('are the stage and layout sections that hold other components', () => {
    const containers = CMS_COMPONENTS.filter((component) => component.acceptsChildren === true);
    expect(containers.map((component) => component.key)).toEqual([
      'home.stage',
      'company.chapter',
      'legal.document',
      'legal.section',
      'detail.live',
    ]);
  });
});

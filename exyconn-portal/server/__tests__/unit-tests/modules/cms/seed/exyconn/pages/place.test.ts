import { cmsComponent, compileHtml, componentPlaceholder } from '@exyconn/cms';
import { place } from '../../../../../../../src/modules/cms/seed/exyconn/pages/place';

describe('seed pages place (props optional)', () => {
  it('uses the catalogue defaults when no props are given', () => {
    const defaults = cmsComponent('blog.list')?.defaultProps;

    const html = place('blog.list');

    expect(html).toBe(componentPlaceholder('blog.list', defaults ?? {}, ''));
    expect(compileHtml(html, '').blocks).toEqual([
      { kind: 'component', key: 'blog.list', props: defaults, children: [] },
    ]);
  });

  it("uses the page's own props when they are given, even empty ones", () => {
    const [own] = compileHtml(place('blog.list', { heading: 'Ours' }), '').blocks;
    const [empty] = compileHtml(place('blog.list', {}), '').blocks;

    expect(own).toMatchObject({ key: 'blog.list', props: { heading: 'Ours' } });
    expect(empty).toMatchObject({ key: 'blog.list', props: {} });
  });

  it('nests the children HTML inside a container placed with its defaults', () => {
    const child = place('legal.section', { heading: 'Inner' });

    const [outer] = compileHtml(place('legal.document', undefined, child), '').blocks;

    expect(outer).toMatchObject({
      kind: 'component',
      key: 'legal.document',
      props: cmsComponent('legal.document')?.defaultProps,
    });
    expect(outer.kind === 'component' && outer.children).toEqual([
      { kind: 'component', key: 'legal.section', props: { heading: 'Inner' }, children: [] },
    ]);
  });

  it('throws for a key the component catalogue does not have', () => {
    expect(() => place('nope.missing')).toThrow(
      'The CMS seed places "nope.missing", which is not in the component catalogue.',
    );
    expect(() => place('nope.missing', { a: 1 })).toThrow('"nope.missing"');
  });
});

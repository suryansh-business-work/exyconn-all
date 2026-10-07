import { cmsComponent, compileHtml, componentPlaceholder } from '@exyconn/cms';
import { place } from '../../../../../../src/modules/cms/seed/exyconn/place';

describe('seed place (page props required)', () => {
  it('writes the catalogue placeholder with exactly the props it is given', () => {
    const props = { heading: 'Legal & "terms"', items: [1, 2] };

    const html = place('legal.section', props);

    expect(html).toBe(componentPlaceholder('legal.section', props, ''));
    expect(compileHtml(html, '').blocks).toEqual([
      { kind: 'component', key: 'legal.section', props, children: [] },
    ]);
  });

  it('nests the children HTML inside the placed container', () => {
    const child = place('legal.section', { heading: 'Inner' });

    const html = place('legal.document', { title: 'Outer' }, child);

    const [outer] = compileHtml(html, '').blocks;
    expect(outer).toMatchObject({ kind: 'component', key: 'legal.document' });
    expect(outer.kind === 'component' && outer.children).toEqual([
      { kind: 'component', key: 'legal.section', props: { heading: 'Inner' }, children: [] },
    ]);
  });

  it('does not fall back to the catalogue defaults when given empty props', () => {
    expect(cmsComponent('blog.list')?.defaultProps).not.toEqual({});

    const [block] = compileHtml(place('blog.list', {}), '').blocks;

    expect(block).toMatchObject({ key: 'blog.list', props: {} });
  });

  it('throws for a key the component catalogue does not have', () => {
    expect(() => place('nope.missing', {})).toThrow(
      'The CMS seed places "nope.missing", which is not in the component catalogue.',
    );
  });
});

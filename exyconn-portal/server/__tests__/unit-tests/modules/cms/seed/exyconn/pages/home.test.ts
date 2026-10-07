import { cmsComponent, compileHtml, type CmsBlock } from '@exyconn/cms';
import { HOME_PAGE } from '../../../../../../../src/modules/cms/seed/exyconn/pages/home';

const CHAPTERS = [
  'home.hero',
  'home.solutions',
  'home.industries',
  'home.partner',
  'home.platforms',
  'home.closing',
];

const keyOf = (block: CmsBlock) => (block.kind === 'component' ? block.key : block.kind);

describe('HOME_PAGE', () => {
  it('is the site root, indexed, with no CSS of its own', () => {
    expect(HOME_PAGE).toMatchObject({ key: 'home', path: '/', kind: 'PAGE', layout: 'default' });
    expect(HOME_PAGE.seo.noindex).toBe(false);
    expect(HOME_PAGE.seo.title).toBe(HOME_PAGE.title);
    expect(HOME_PAGE.css).toBe('');
  });

  it('keeps the service count as a placeholder the website fills in', () => {
    expect(HOME_PAGE.seo.description).toContain('{serviceCount}');
  });

  it('places the home stage with the six chapters scrolling inside it, in order', () => {
    const { blocks } = compileHtml(HOME_PAGE.html, HOME_PAGE.css);

    expect(blocks).toHaveLength(1);
    const [stage] = blocks;
    expect(stage.kind === 'component' && stage.key).toBe('home.stage');
    const children = stage.kind === 'component' ? stage.children : [];
    expect(children.map(keyOf)).toEqual(CHAPTERS);
  });

  it('seeds every section with its catalogue defaults', () => {
    const [stage] = compileHtml(HOME_PAGE.html, '').blocks;
    const sections = stage.kind === 'component' ? [stage, ...stage.children] : [];

    expect(sections).toHaveLength(7);
    for (const section of sections) {
      expect(section.kind).toBe('component');
      if (section.kind === 'component') {
        expect(section.props).toEqual(cmsComponent(section.key)?.defaultProps);
      }
    }
  });
});

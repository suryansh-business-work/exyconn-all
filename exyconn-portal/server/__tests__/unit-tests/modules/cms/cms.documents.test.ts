import {
  assertDraft,
  compileDraft,
  statusAfterEdit,
} from '../../../../src/modules/cms/cms.documents';
import { CmsFragmentModel } from '../../../../src/modules/cms/models';
import { KNOWN_COMPONENT, componentHtml, fragmentHtml } from './cms.fixtures';

const SITE = 'site-1';

describe('assertDraft', () => {
  it('accepts a draft at the size limits', () => {
    expect(() =>
      assertDraft({ html: 'a'.repeat(2_000_000), css: 'b'.repeat(1_000_000) }),
    ).not.toThrow();
  });

  it('refuses HTML or CSS over the limit', () => {
    const message = 'This page is too large to save. Split it into fragments.';
    expect(() => assertDraft({ html: 'a'.repeat(2_000_001), css: '' })).toThrow(message);
    expect(() => assertDraft({ html: '', css: 'b'.repeat(1_000_001) })).toThrow(message);
  });
});

describe('compileDraft', () => {
  it('compiles plain HTML and keeps the CSS', async () => {
    const compiled = await compileDraft({ html: '<p>Hello</p>', css: 'p{}' }, SITE);

    expect(compiled).toEqual({ blocks: [{ kind: 'html', html: '<p>Hello</p>' }], css: 'p{}' });
  });

  it('compiles a known component', async () => {
    const compiled = await compileDraft({ html: componentHtml(KNOWN_COMPONENT), css: '' }, SITE);

    expect(compiled.blocks).toEqual([
      { kind: 'component', key: KNOWN_COMPONENT, props: {}, children: [] },
    ]);
  });

  it('turns a malformed placeholder into a message for the editor', async () => {
    const html = `<exy-component data-key="${KNOWN_COMPONENT}">`;

    await expect(compileDraft({ html, css: '' }, SITE)).rejects.toThrow(
      `Component "${KNOWN_COMPONENT}" is never closed.`,
    );
  });

  it('lets an error that is not a compile error through unchanged', async () => {
    const corrupt = { html: undefined as unknown as string, css: '' };

    await expect(compileDraft(corrupt, SITE)).rejects.toThrow(TypeError);
  });

  it('names every unknown component once, nested ones included', async () => {
    const html =
      componentHtml(KNOWN_COMPONENT, componentHtml('nope.inner')) +
      componentHtml('nope.outer') +
      componentHtml('nope.outer');

    await expect(compileDraft({ html, css: '' }, SITE)).rejects.toThrow(
      'Unknown component: nope.inner, nope.outer.',
    );
  });

  it('refuses a fragment placed inside itself', async () => {
    const fragment = await CmsFragmentModel.create({ siteId: SITE, name: 'Header' });
    const id = String(fragment._id);

    await expect(compileDraft({ html: fragmentHtml(id), css: '' }, SITE, id)).rejects.toThrow(
      'A fragment cannot contain itself.',
    );
  });

  it('accepts a fragment of the same site, inside another fragment too', async () => {
    const fragment = await CmsFragmentModel.create({ siteId: SITE, name: 'Header' });
    const other = await CmsFragmentModel.create({ siteId: SITE, name: 'Footer' });
    const html = fragmentHtml(String(fragment._id));

    const compiled = await compileDraft({ html, css: '' }, SITE, String(other._id));

    expect(compiled.blocks).toEqual([{ kind: 'fragment', fragmentId: String(fragment._id) }]);
  });

  it('refuses a fragment of another site, or one that is not an id', async () => {
    const foreign = await CmsFragmentModel.create({ siteId: 'site-2', name: 'Header' });
    const message = 'A fragment on this page no longer exists on this site.';

    await expect(
      compileDraft({ html: fragmentHtml(String(foreign._id)), css: '' }, SITE),
    ).rejects.toThrow(message);
    await expect(
      compileDraft({ html: fragmentHtml('seed:header'), css: '' }, SITE),
    ).rejects.toThrow(message);
  });
});

describe('statusAfterEdit', () => {
  it('stays a draft until first published, then reads as changed', () => {
    expect(statusAfterEdit(null)).toBe('DRAFT');
    expect(statusAfterEdit(undefined)).toBe('DRAFT');
    expect(statusAfterEdit({ blocks: [] })).toBe('CHANGED');
  });
});

import { Types } from 'mongoose';
import { cmsDesignSystems } from '../../../../src/modules/cms/cms.design';

const SITE = 'site-1';

// `create` checks the tokens synchronously; the async wrapper turns that throw into a rejection.
const create = async (tokens: Record<string, unknown>, extraCss?: string | null) =>
  cmsDesignSystems.create({ siteId: SITE, name: 'Brand', tokens, extraCss });

const missingId = () => new Types.ObjectId().toHexString();

describe('design system CRUD', () => {
  it('creates, reads, lists, updates and removes a design system', async () => {
    const tokens = {
      palette: { primary: '#123456' },
      colors: { light: { ink: '#000' }, dark: { ink: '#fff' } },
      radii: { sm: '4px' },
    };
    const created = await create(tokens);
    const id = created._id.toHexString();
    await cmsDesignSystems.create({ siteId: SITE, name: 'Alt', tokens: {}, extraCss: '.a{}' });

    expect(created).toMatchObject({ siteId: SITE, name: 'Brand', tokens, extraCss: '' });
    await expect(cmsDesignSystems.get(id)).resolves.toMatchObject({ name: 'Brand' });
    const listed = await cmsDesignSystems.list(SITE);
    expect(listed.map((design) => design.name)).toEqual(['Alt', 'Brand']);

    const updated = await cmsDesignSystems.update(id, {
      siteId: SITE,
      name: 'Brand v2',
      tokens: { spacing: { md: '16px' } },
      extraCss: 'body{}',
    });
    expect(updated).toMatchObject({
      name: 'Brand v2',
      tokens: { spacing: { md: '16px' } },
      extraCss: 'body{}',
    });

    await expect(cmsDesignSystems.remove(id)).resolves.toBe(true);
    await expect(cmsDesignSystems.get(id)).rejects.toThrow('Design system not found');
  });

  it('says when a design system does not exist', async () => {
    const input = { siteId: SITE, name: 'X', tokens: {} };

    await expect(cmsDesignSystems.update(missingId(), input)).rejects.toThrow(
      'Design system not found',
    );
    await expect(cmsDesignSystems.remove(missingId())).rejects.toThrow('Design system not found');
  });

  it('clears the extra CSS when an update sends none', async () => {
    const created = await create({}, 'p{}');

    const updated = await cmsDesignSystems.update(created._id.toHexString(), {
      siteId: SITE,
      name: 'Brand',
      tokens: {},
      extraCss: null,
    });

    expect(updated.extraCss).toBe('');
  });
});

describe('token checks', () => {
  it('refuses a group that is not a design token group', async () => {
    await expect(create({ animations: {} })).rejects.toThrow(
      '"animations" is not a design token group.',
    );
  });

  it.each([[[]], [null], ['16px']])('refuses %p as a flat token group', async (values) => {
    await expect(create({ spacing: values })).rejects.toThrow(
      'The spacing tokens must be a list of name → value.',
    );
  });

  it.each([
    ['--primary', '#fff'],
    ['primary', 12],
    ['primary', 'red; } body { color: red'],
    ['primary', ''],
  ])('refuses the token %s: %p', async (key, value) => {
    await expect(create({ palette: { [key]: value } })).rejects.toThrow(
      `"${key}" in palette is not a valid token.`,
    );
  });

  it('accepts colours with no modes at all', async () => {
    await expect(create({ colors: null })).resolves.toMatchObject({ tokens: { colors: null } });
  });

  it('accepts only light and dark colour modes, each a flat group', async () => {
    await expect(create({ colors: { sepia: {} } })).rejects.toThrow(
      'Colours are given for light and dark only.',
    );
    await expect(create({ colors: { light: 'red' } })).rejects.toThrow(
      'The light colours tokens must be a list of name → value.',
    );
    await expect(create({ colors: { dark: { 'bad key': '#000' } } })).rejects.toThrow(
      '"bad key" in dark colours is not a valid token.',
    );
  });

  it('checks the tokens on update too', async () => {
    const created = await create({});

    await expect(
      cmsDesignSystems.update(created._id.toHexString(), {
        siteId: SITE,
        name: 'Brand',
        tokens: { shadows: { lg: '<script>' } },
      }),
    ).rejects.toThrow('"lg" in shadows is not a valid token.');
  });
});

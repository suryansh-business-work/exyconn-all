import { CMS_COMPONENTS } from '@exyconn/cms';
import { cmsResolvers } from '../../../../src/modules/cms';
import { AuditLogModel } from '../../../../src/modules/audit';
import { readARecords, setARecord } from '../../../../src/modules/dns';
import { CmsSiteModel } from '../../../../src/modules/cms/models';
import { editorCtx, seedSite } from './cms.fixtures';

jest.mock('../../../../src/modules/dns', () => ({
  readARecords: jest.fn(),
  setARecord: jest.fn(),
}));

const { Query, Mutation } = cmsResolvers;
const SERVER_IP = '203.0.113.10';
const records = {
  host: 'docs.test',
  zone: 'docs.test',
  name: '@',
  authority: 'CLOUDFLARE' as const,
  records: [{ ip: SERVER_IP, ttl: 600 }],
};

/** The id every resolver hands back alongside the document. */
const idOf = (doc: unknown) => (doc as { id: string }).id;

const siteInput = {
  name: 'Docs',
  slug: 'docs',
  domains: ['docs.test'],
  status: 'ACTIVE' as const,
  markets: false,
  defaultLocale: 'en',
};

describe('websites', () => {
  it('creates, reads, updates, makes default and deletes sites', async () => {
    const ctx = editorCtx();
    const home = await seedSite('home', { isDefault: true });

    const created = await Mutation.createCmsSite(null, { input: siteInput }, ctx);
    const id = idOf(created);
    expect(created).toMatchObject({ id: expect.any(String), slug: 'docs' });

    const listed = await Query.cmsSites(null, {}, ctx);
    expect(listed.map((site) => site.id)).toEqual([String(home._id), id]);
    await expect(Query.cmsSite(null, { id }, ctx)).resolves.toMatchObject({
      name: 'Docs',
    });
    await expect(Query.cmsSiteBySlug(null, { slug: 'docs' }, ctx)).resolves.toMatchObject({
      id,
    });

    const updated = await Mutation.updateCmsSite(
      null,
      { id, input: { ...siteInput, name: 'Docs v2' } },
      ctx,
    );
    expect(updated).toMatchObject({ name: 'Docs v2' });

    await expect(Mutation.setDefaultCmsSite(null, { id }, ctx)).resolves.toMatchObject({
      isDefault: true,
    });
    await expect(Mutation.deleteCmsSite(null, { id: String(home._id) }, ctx)).resolves.toBe(true);
    await expect(CmsSiteModel.countDocuments()).resolves.toBe(1);
  });

  it('refuses somebody who is not signed in', async () => {
    await expect(Query.cmsSites(null, {}, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('website domains', () => {
  it('reads the DNS of every domain of a site', async () => {
    const site = await seedSite('docs', { domains: ['docs.test'] });
    jest.mocked(readARecords).mockResolvedValueOnce(records);

    const result = await Query.cmsSiteDns(null, { siteId: String(site._id) }, editorCtx());

    expect(result.domains).toEqual([
      expect.objectContaining({ domain: 'docs.test', authority: 'CLOUDFLARE', error: '' }),
    ]);
  });

  it('points a domain at an address and records who did it', async () => {
    const site = await seedSite('docs', { domains: ['docs.test'] });
    jest.mocked(setARecord).mockResolvedValueOnce(records);
    jest.mocked(readARecords).mockResolvedValueOnce(records);

    const result = await Mutation.setCmsSiteARecord(
      null,
      { siteId: String(site._id), domain: 'docs.test', ip: SERVER_IP, ttl: 600 },
      editorCtx(),
    );

    expect(result).toMatchObject({ domain: 'docs.test', records: records.records });
    const audit = await AuditLogModel.findOne({ module: 'CmsSite' }).lean();
    expect(audit).toMatchObject({
      action: 'UPDATE',
      entityId: String(site._id),
      summary: `Pointed docs.test at ${SERVER_IP} (A record, TTL 600s)`,
    });
  });
});

describe('design systems', () => {
  it('creates, lists, reads, updates and deletes a design system', async () => {
    const ctx = editorCtx();
    const input = { siteId: 'site-1', name: 'Brand', tokens: { radii: { sm: '2px' } } };

    const created = await Mutation.createCmsDesignSystem(null, { input }, ctx);
    const id = idOf(created);
    expect(created).toMatchObject({ id: expect.any(String), name: 'Brand' });

    const listed = await Query.cmsDesignSystems(null, { siteId: 'site-1' }, ctx);
    expect(listed.map((design) => design.id)).toEqual([id]);
    await expect(Query.cmsDesignSystem(null, { id }, ctx)).resolves.toMatchObject({ id });

    await expect(
      Mutation.updateCmsDesignSystem(null, { id, input: { ...input, name: 'Brand v2' } }, ctx),
    ).resolves.toMatchObject({ name: 'Brand v2' });
    await expect(Mutation.deleteCmsDesignSystem(null, { id }, ctx)).resolves.toBe(true);
  });
});

describe('editor catalogues', () => {
  it('lists every component, saying whether it takes children', async () => {
    const components = await Query.cmsComponents(null, {}, editorCtx());

    expect(components).toHaveLength(CMS_COMPONENTS.length);
    expect(components.every((component) => typeof component.acceptsChildren === 'boolean')).toBe(
      true,
    );
    expect(components.some((component) => component.acceptsChildren)).toBe(true);
  });

  it('searches Google Fonts with the default limit when none is given', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ familyMetadataList: [{ family: 'Inter', category: 'Sans Serif' }] }),
        ),
      );

    const fonts = await Query.cmsGoogleFonts(
      null,
      { search: 'int', category: null, limit: null },
      editorCtx(),
    );

    const limited = await Query.cmsGoogleFonts(null, { limit: 1 }, editorCtx());

    expect(fonts).toMatchObject({ totalCount: 1, rows: [{ family: 'Inter' }] });
    expect(limited.rows).toHaveLength(1);
    fetchMock.mockRestore();
  });
});

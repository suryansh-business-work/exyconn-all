import { brandingResolvers } from '../../../../src/modules/branding';
import { BrandingModel } from '../../../../src/modules/branding/branding.model';
import { BRANDING_DEFAULTS } from '../../../../src/modules/branding/branding.constants';
import { imageUploader } from '../../../../src/utils/imagekit';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: 'u1', email: 'u@exyconn.com', roles },
});
const anonymous: GraphQLContext = { user: null };

const { Query, Mutation } = brandingResolvers;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('branding queries', () => {
  it('serves the brand to any signed-in user, with an id', async () => {
    const branding = await Query.branding(null, null, as([ROLES.EMPLOYEE]));

    expect(branding.businessName).toBe(BRANDING_DEFAULTS.businessName);
    expect(branding.id).toMatch(/^[a-f\d]{24}$/);
  });

  it('refuses the brand to an anonymous caller', async () => {
    expect(await codeOf(Query.branding(null, null, anonymous))).toBe('UNAUTHENTICATED');
  });

  it('serves the public brand from defaults before any company saved one', async () => {
    const branding = await Query.publicBranding();

    expect(branding.id).toBe('global');
    expect(branding.slogan).toBe(BRANDING_DEFAULTS.slogan);
    expect(branding.loginPages.length).toBeGreaterThan(0);
  });

  it('serves the earliest company brand on the public sign-in page', async () => {
    const first = '64b000000000000000000001';
    const second = '64b000000000000000000002';
    await runForOrganization(first, () =>
      BrandingModel.create({ businessName: 'First Co', createdAt: new Date('2024-01-01') }),
    );
    await runForOrganization(second, () =>
      BrandingModel.create({ businessName: 'Second Co', createdAt: new Date('2025-01-01') }),
    );

    const branding = await Query.publicBranding();

    expect(branding.businessName).toBe('First Co');
    expect(await runAsPlatform(() => BrandingModel.countDocuments())).toBe(2);
  });
});

describe('updateBranding', () => {
  it('lets an administrator change the brand', async () => {
    const branding = await Mutation.updateBranding(
      null,
      { input: { businessName: 'Exyconn Labs' } },
      as([ROLES.ADMIN]),
    );

    expect(branding).toMatchObject({ businessName: 'Exyconn Labs', id: expect.any(String) });
  });

  it('refuses anybody who is not an administrator', async () => {
    const attempt = Mutation.updateBranding(
      null,
      { input: { businessName: 'Hijacked' } },
      as([ROLES.HR]),
    );

    expect(await codeOf(attempt)).toBe('FORBIDDEN');
    expect(await BrandingModel.countDocuments({ businessName: 'Hijacked' })).toBe(0);
  });
});

describe('uploadImage', () => {
  it('hands an image to the uploader and returns its hosted address', async () => {
    const upload = jest
      .spyOn(imageUploader, 'uploadImage')
      .mockResolvedValue('https://ik.example.com/logo.png');

    const url = await Mutation.uploadImage(
      null,
      { file: 'data:image/png;base64,AAAA', fileName: 'logo.png', folder: 'branding' },
      as([ROLES.EMPLOYEE]),
    );

    expect(url).toBe('https://ik.example.com/logo.png');
    expect(upload).toHaveBeenCalledWith('data:image/png;base64,AAAA', 'logo.png', 'branding');
  });

  it('refuses an image over 12 MB before uploading anything', async () => {
    const upload = jest.spyOn(imageUploader, 'uploadImage');
    const file = 'a'.repeat(12 * 1024 * 1024 + 1);

    const attempt = Mutation.uploadImage(null, { file, fileName: 'big.png' }, as([ROLES.HR]));

    await expect(attempt).rejects.toThrow(/too large/);
    expect(upload).not.toHaveBeenCalled();
  });

  it('refuses an anonymous upload', async () => {
    const attempt = Mutation.uploadImage(null, { file: 'x', fileName: 'x.png' }, anonymous);

    expect(await codeOf(attempt)).toBe('UNAUTHENTICATED');
  });
});

describe('importMediaFromUrl', () => {
  it('imports a Pexels asset through the uploader', async () => {
    const importFromUrl = jest
      .spyOn(imageUploader, 'uploadFromUrl')
      .mockResolvedValue('https://ik.example.com/hero.mp4');
    const url = 'https://videos.pexels.com/video-files/1/hero.mp4';

    const hosted = await Mutation.importMediaFromUrl(
      null,
      { url, fileName: 'hero.mp4' },
      as([ROLES.ADMIN]),
    );

    expect(hosted).toBe('https://ik.example.com/hero.mp4');
    expect(importFromUrl).toHaveBeenCalledWith(url, 'hero.mp4', undefined);
  });

  it('refuses a URL that is not on the Pexels CDN', async () => {
    const importFromUrl = jest.spyOn(imageUploader, 'uploadFromUrl');

    const attempt = Mutation.importMediaFromUrl(
      null,
      { url: 'https://evil.example.com/x.jpg', fileName: 'x.jpg' },
      as([ROLES.ADMIN]),
    );

    await expect(attempt).rejects.toThrow(/Only Pexels/);
    expect(importFromUrl).not.toHaveBeenCalled();
  });

  it('refuses an anonymous import', async () => {
    const attempt = Mutation.importMediaFromUrl(
      null,
      { url: 'https://images.pexels.com/a.jpg', fileName: 'a.jpg' },
      anonymous,
    );

    expect(await codeOf(attempt)).toBe('UNAUTHENTICATED');
  });
});

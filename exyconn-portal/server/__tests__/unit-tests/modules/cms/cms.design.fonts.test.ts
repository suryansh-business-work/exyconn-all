import { cmsDesignSystems } from '../../../../src/modules/cms/cms.design';

const withFonts = (fontSources: unknown) =>
  cmsDesignSystems.create({ siteId: 'site-1', name: 'Brand', tokens: { fontSources } });

const file = (fields: Record<string, unknown> = {}) => ({
  url: 'https://cdn.test/inter-400.woff2',
  weight: '400',
  style: 'normal',
  format: 'woff2',
  ...fields,
});

describe('font sources', () => {
  it('accepts Google families and uploaded families', async () => {
    const fontSources = [
      { family: 'Inter', provider: 'GOOGLE', variants: ['400', '700i'] },
      {
        family: "Brand Sans & Co.'s",
        provider: 'CUSTOM',
        files: [file(), file({ style: 'italic' })],
      },
    ];

    await expect(withFonts(fontSources)).resolves.toMatchObject({ tokens: { fontSources } });
  });

  it('refuses something that is not a list, and more than 30 families', async () => {
    const message = 'Load at most 30 font families.';
    const many = Array.from({ length: 31 }, () => ({
      family: 'Inter',
      provider: 'GOOGLE',
      variants: ['400'],
    }));

    await expect(withFonts({ family: 'Inter' })).rejects.toThrow(message);
    await expect(withFonts(many)).rejects.toThrow(message);
  });

  it.each([[''], ['<b>'], [42]])('refuses the family name %p', async (family) => {
    const name = typeof family === 'string' ? family : '';

    await expect(withFonts([{ family, provider: 'GOOGLE', variants: ['400'] }])).rejects.toThrow(
      `"${name}" is not a valid font family name.`,
    );
  });

  it.each([[undefined], [[]], [['450']], [[400]]])(
    'refuses the Google styles %p',
    async (variants) => {
      await expect(withFonts([{ family: 'Inter', provider: 'GOOGLE', variants }])).rejects.toThrow(
        'Choose the styles of Inter to load (400, 700, 400i …).',
      );
    },
  );

  it('refuses an upload with no files or too many', async () => {
    const message = 'Upload at least one file for Brand.';
    const tooMany = Array.from({ length: 41 }, () => file());

    await expect(withFonts([{ family: 'Brand', provider: 'CUSTOM' }])).rejects.toThrow(message);
    await expect(withFonts([{ family: 'Brand', provider: 'CUSTOM', files: [] }])).rejects.toThrow(
      message,
    );
    await expect(
      withFonts([{ family: 'Brand', provider: 'CUSTOM', files: tooMany }]),
    ).rejects.toThrow(message);
  });

  it.each([
    [{ url: 'http://cdn.test/a.woff2' }, 'has no valid https address.'],
    [{ url: 'https://cdn.test/a b.woff2' }, 'has no valid https address.'],
    [{ url: 'https://cdn.test/a").woff2' }, 'has no valid https address.'],
    [{ url: 42 }, 'has no valid https address.'],
    [{ weight: '450' }, 'needs a weight from 100 to 900.'],
    [{ weight: 400 }, 'needs a weight from 100 to 900.'],
    [{ style: 'oblique' }, 'must be normal or italic.'],
    [{ style: undefined }, 'must be normal or italic.'],
    [{ format: 'eot' }, 'must be WOFF2, WOFF, TTF or OTF.'],
    [{ format: null }, 'must be WOFF2, WOFF, TTF or OTF.'],
  ])('refuses an uploaded file with %p', async (fields, problem) => {
    await expect(
      withFonts([{ family: 'Brand', provider: 'CUSTOM', files: [file(fields)] }]),
    ).rejects.toThrow(`A file of Brand ${problem}`);
  });

  it('refuses a family that is neither from Google nor uploaded', async () => {
    await expect(withFonts([{ family: 'Brand', provider: 'ADOBE' }])).rejects.toThrow(
      'Brand must come from Google Fonts or an upload.',
    );
  });
});

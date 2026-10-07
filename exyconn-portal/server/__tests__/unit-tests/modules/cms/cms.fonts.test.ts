type FontsModule = typeof import('../../../../src/modules/cms/cms.fonts');

/** A fresh copy of the module each time, so no test sees another's cached catalogue. */
function loadFonts(): FontsModule {
  const holder: { fonts?: FontsModule } = {};
  jest.isolateModules(() => {
    holder.fonts = jest.requireActual<FontsModule>('../../../../src/modules/cms/cms.fonts');
  });
  if (!holder.fonts) {
    throw new Error('cms.fonts did not load');
  }
  return holder.fonts;
}

const CATALOGUE = {
  familyMetadataList: [
    {
      family: 'Lora',
      category: 'Serif',
      fonts: { '700i': {}, '400': {}, '400i': {}, '100': {} },
      subsets: ['menu', 'latin'],
      axes: [{ tag: 'wght', min: 400, max: 700, extra: true }],
      popularity: 20,
    },
    { family: 'Inter', category: 'Sans Serif', fonts: { '400': {} }, popularity: 1 },
    { family: 'Obscure', category: 'Display' },
  ],
};

const fetchMock = jest.spyOn(globalThis, 'fetch');

const serve = (body: unknown, prefix = '') =>
  fetchMock.mockResolvedValue(new Response(prefix + JSON.stringify(body)));

describe('googleFonts', () => {
  it('reads the catalogue past its guard prefix, most used first', async () => {
    serve(CATALOGUE, ")]}'\n");
    const { googleFonts } = loadFonts();

    const result = await googleFonts();

    expect(result.totalCount).toBe(3);
    expect(result.rows.map((font) => font.family)).toEqual(['Inter', 'Lora', 'Obscure']);
    expect(result.rows[1]).toEqual({
      family: 'Lora',
      category: 'Serif',
      variants: ['100', '400', '400i', '700i'],
      subsets: ['latin'],
      axes: [{ tag: 'wght', min: 400, max: 700 }],
      popularity: 20,
    });
    expect(result.rows[2]).toMatchObject({
      variants: [],
      subsets: [],
      axes: [],
      popularity: Number.MAX_SAFE_INTEGER,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://fonts.google.com/metadata/fonts',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('filters by family name and category', async () => {
    serve(CATALOGUE);
    const { googleFonts, FONT_CATEGORIES } = loadFonts();

    const byName = await googleFonts('  LO ');
    const byCategory = await googleFonts(null, 'Sans Serif');
    const both = await googleFonts('lora', 'Sans Serif');

    expect(byName.rows.map((font) => font.family)).toEqual(['Lora']);
    expect(byCategory.rows.map((font) => font.family)).toEqual(['Inter']);
    expect(both).toEqual({ totalCount: 0, rows: [] });
    expect(FONT_CATEGORIES).toContain('Sans Serif');
  });

  it('keeps the number of results between 1 and 200', async () => {
    const familyMetadataList = Array.from({ length: 205 }, (_, index) => ({
      family: `Family ${index}`,
      category: 'Serif',
      popularity: index,
    }));
    serve({ familyMetadataList });
    const { googleFonts } = loadFonts();

    const defaults = await googleFonts();
    const none = await googleFonts('', '', 0);
    const all = await googleFonts(undefined, undefined, 500);

    expect(defaults.rows).toHaveLength(60);
    expect(none.rows).toHaveLength(1);
    expect(all.rows).toHaveLength(200);
    expect(all.totalCount).toBe(205);
  });

  it('reads the catalogue once and serves later searches from memory', async () => {
    serve(CATALOGUE);
    const { googleFonts } = loadFonts();

    await googleFonts();
    await googleFonts('inter');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reads the catalogue again once a day has passed', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(CATALOGUE)));
    const { googleFonts } = loadFonts();
    const start = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(start);

    await googleFonts();
    clock.mockReturnValue(start + 24 * 60 * 60 * 1000 + 1);
    await googleFonts();
    clock.mockRestore();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('treats a catalogue without families as empty', async () => {
    serve({});
    const { googleFonts } = loadFonts();

    await expect(googleFonts()).resolves.toEqual({ totalCount: 0, rows: [] });
  });

  it('says Google Fonts is unreachable when it answers with an error', async () => {
    fetchMock.mockResolvedValue(new Response('busy', { status: 503 }));
    const { googleFonts } = loadFonts();

    await expect(googleFonts()).rejects.toThrow(
      'Google Fonts could not be reached just now. Try again in a minute.',
    );
  });

  it('says Google Fonts is unreachable when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const { googleFonts } = loadFonts();

    await expect(googleFonts()).rejects.toThrow('Google Fonts could not be reached just now.');
  });
});

import { firecrawlScrape, scrapeUrlOf } from '../../../../src/modules/web-scraper/firecrawl.client';

/** Never a literal credential: the value only has to look like a key. */
const API_KEY = process.env.TEST_FIRECRAWL_KEY ?? `fc-${'k'.repeat(16)}`;
const BASE = 'https://api.firecrawl.dev';

const answer = (status: number, body: unknown) =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('scrapeUrlOf', () => {
  it.each([BASE, `${BASE}/`, `${BASE}///`])('reaches v2/scrape from %s', (base) => {
    expect(scrapeUrlOf(base)).toBe(`${BASE}/v2/scrape`);
  });
});

describe('firecrawlScrape', () => {
  it('posts the page with the key and reads back its title and markdown', async () => {
    const fetchMock = answer(200, {
      success: true,
      data: { markdown: '# Hello', metadata: { title: 'Example' } },
    });

    const page = await firecrawlScrape(BASE, API_KEY, 'https://example.com');

    expect(page).toEqual({ title: 'Example', markdown: '# Hello' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/v2/scrape`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      url: 'https://example.com',
      formats: ['markdown'],
      onlyMainContent: true,
    });
  });

  it('sends no Authorization header to a self-hosted install without a key', async () => {
    const fetchMock = answer(200, { success: true, data: { markdown: 'x' } });

    await firecrawlScrape('http://firecrawl.internal:3002', '', 'https://example.com');

    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('reads an answer with no data as an empty page', async () => {
    answer(200, { success: true });

    await expect(firecrawlScrape(BASE, API_KEY, 'https://example.com')).resolves.toEqual({
      title: '',
      markdown: '',
    });
  });

  it('keeps Firecrawl’s own error when it says it failed', async () => {
    answer(200, { success: false, error: 'Blocked by robots.txt' });

    await expect(firecrawlScrape(BASE, API_KEY, 'https://example.com')).rejects.toThrow(
      'Firecrawl could not read the page: Blocked by robots.txt',
    );
  });

  it('names the HTTP status when an error answer carries no message', async () => {
    answer(402, {});

    await expect(firecrawlScrape(BASE, API_KEY, 'https://example.com')).rejects.toThrow(
      'Firecrawl could not read the page: HTTP 402',
    );
  });

  it('names the HTTP status when the body is not JSON at all', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expect(firecrawlScrape(BASE, API_KEY, 'https://example.com')).rejects.toThrow(
      'Firecrawl could not read the page: HTTP 502',
    );
  });
});

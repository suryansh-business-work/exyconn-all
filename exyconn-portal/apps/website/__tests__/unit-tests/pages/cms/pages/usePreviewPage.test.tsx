import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { CmsPreviewTokenDocument } from '@exyconn/shell/graphql/generated';
import { usePreviewPage, usePreviewUrl } from '../../../../../src/pages/cms/pages/usePreviewPage';
import { renderHookInSite } from '../cms-helpers';

const spies = vi.hoisted(() => ({ query: vi.fn(), notify: vi.fn(), open: vi.fn() }));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => ({ query: spies.query }),
}));
vi.mock('@exyconn/shell/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/config/env')>();
  return { env: { ...actual.env, websiteOrigin: '' } };
});
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));

const PREVIEW = 'https://exyconn.com/cms-preview?token=a%2Bb';
const newTab = () => ({ location: { href: '' }, close: vi.fn() });

describe('usePreviewUrl', () => {
  beforeEach(() => {
    spies.query.mockReset();
    spies.query.mockResolvedValue({ data: { cmsPreviewToken: 'a+b' } });
  });

  it("addresses the page's draft on the site's own domain with a fresh token", async () => {
    const { result } = renderHookInSite(() => usePreviewUrl());

    await expect(result.current('page-1')).resolves.toBe(PREVIEW);
    expect(spies.query).toHaveBeenCalledWith({
      query: CmsPreviewTokenDocument,
      variables: { pageId: 'page-1' },
      fetchPolicy: 'network-only',
    });
  });

  it('rejects when the server returns no token', async () => {
    spies.query.mockResolvedValue({});
    const { result } = renderHookInSite(() => usePreviewUrl());

    await expect(result.current('page-1')).rejects.toThrow('The preview link returned no data');
  });
});

describe('usePreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.query.mockResolvedValue({ data: { cmsPreviewToken: 'a+b' } });
    vi.stubGlobal('open', spies.open);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const preview = () => renderHookInSite(() => usePreviewPage()).result.current;

  it('opens the tab at the click, saves first, then points it at the draft', async () => {
    const tab = newTab();
    spies.open.mockReturnValue(tab);
    const beforeOpen = vi.fn().mockResolvedValue(true);

    preview()('page-1', beforeOpen);

    expect(spies.open).toHaveBeenCalledWith('', '_blank');
    await waitFor(() => expect(tab.location.href).toBe(PREVIEW));
    expect(beforeOpen).toHaveBeenCalledTimes(1);
  });

  it('opens the draft in a new window when the blank tab was blocked', async () => {
    spies.open.mockReturnValue(null);

    preview()('page-1');

    await waitFor(() => expect(spies.open).toHaveBeenLastCalledWith(PREVIEW, '_blank', 'noopener'));
  });

  it('closes the tab and says why the preview failed', async () => {
    const tab = newTab();
    spies.open.mockReturnValue(tab);

    preview()('page-1', vi.fn().mockRejectedValue(new Error('Could not save the draft')));

    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not save the draft', 'error'),
    );
    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(spies.query).not.toHaveBeenCalled();
  });

  it('reports a failure without a reason, with no tab to close', async () => {
    spies.open.mockReturnValue(null);
    spies.query.mockRejectedValueOnce('offline');

    preview()('page-1');

    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not open the preview', 'error'),
    );
    expect(spies.open).toHaveBeenCalledTimes(1);
  });
});

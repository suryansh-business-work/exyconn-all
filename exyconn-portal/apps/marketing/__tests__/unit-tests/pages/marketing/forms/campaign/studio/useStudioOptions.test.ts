import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStudioOptions } from '../../../../../../../src/pages/marketing/forms/campaign/studio/useStudioOptions';

const gql = vi.hoisted(() => ({ options: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCampaignStudioOptionsQuery: () => gql.options(),
}));

describe('useStudioOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hands over the senders, variables and categories the server sends', () => {
    const variables = [
      {
        key: 'contact.firstName',
        label: 'First name',
        group: 'CONTACT',
        description: '',
        example: 'Asha',
      },
    ];
    const categories = [{ id: 'cat-1', name: 'Offers' }];
    gql.options.mockReturnValue({
      data: {
        campaignStudioOptions: { verifiedSenders: ['hello@exyconn.com'], variables, categories },
      },
      loading: false,
      error: undefined,
    });
    expect(renderHook(() => useStudioOptions()).result.current).toEqual({
      verifiedSenders: ['hello@exyconn.com'],
      variables,
      categories,
      loading: false,
      error: null,
    });
  });

  it('is empty while loading', () => {
    gql.options.mockReturnValue({ data: undefined, loading: true, error: undefined });
    expect(renderHook(() => useStudioOptions()).result.current).toEqual({
      verifiedSenders: [],
      variables: [],
      categories: [],
      loading: true,
      error: null,
    });
  });

  it('reports why the options could not load', () => {
    gql.options.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Not allowed'),
    });
    expect(renderHook(() => useStudioOptions()).result.current.error).toBe('Not allowed');
  });
});

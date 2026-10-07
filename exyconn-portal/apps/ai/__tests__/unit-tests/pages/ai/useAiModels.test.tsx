import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { AiModelsDocument } from '@exyconn/shell/graphql/generated';
import { useAiModels } from '../../../../src/pages/ai/useAiModels';

const wrap =
  (mocks: ReadonlyArray<MockLink.MockedResponse>) =>
  ({ children }: Readonly<{ children: ReactNode }>) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );

describe('useAiModels', () => {
  it('turns the models the key can reach into picker options, with the default', async () => {
    const mocks = [
      {
        request: { query: AiModelsDocument },
        result: {
          data: {
            aiModels: {
              __typename: 'AiModelOptions',
              models: ['gpt-4o', 'gpt-4o-mini'],
              defaultModel: 'gpt-4o',
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useAiModels(), { wrapper: wrap(mocks) });
    expect(result.current).toMatchObject({ options: [], defaultModel: '', loading: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toEqual({
      options: [
        { value: 'gpt-4o', label: 'gpt-4o' },
        { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      ],
      defaultModel: 'gpt-4o',
      loading: false,
      error: undefined,
    });
  });

  it('carries the reason the list is empty when the query fails', async () => {
    const mocks = [
      { request: { query: AiModelsDocument }, error: new Error('No active OpenAI key') },
    ];
    const { result } = renderHook(() => useAiModels(), { wrapper: wrap(mocks) });
    await waitFor(() => expect(result.current.error).toBe('No active OpenAI key'));
    expect(result.current.options).toEqual([]);
    expect(result.current.defaultModel).toBe('');
  });
});

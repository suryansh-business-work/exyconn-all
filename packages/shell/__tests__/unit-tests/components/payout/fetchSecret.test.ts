import { describe, expect, it, vi } from 'vitest';
import type { ApolloClient } from '@apollo/client';
import { EmployeePayoutSecretDocument } from '@/graphql/generated';
import { fetchSecret } from '@/components/payout';

const clientAnswering = (data: unknown) =>
  ({ query: vi.fn().mockResolvedValue({ data }) }) as unknown as ApolloClient;

const VARIABLES = { employeeId: 'e1', id: 'pa1', field: 'IBAN' };

describe('fetchSecret', () => {
  it('asks the network, never the cache, and returns the picked value', async () => {
    const client = clientAnswering({ employeePayoutSecret: 'DE89370400440532013000' });

    const value = await fetchSecret(
      client,
      EmployeePayoutSecretDocument,
      VARIABLES,
      (data: { employeePayoutSecret: string }) => data.employeePayoutSecret,
    );

    expect(value).toBe('DE89370400440532013000');
    expect(client.query).toHaveBeenCalledWith({
      query: EmployeePayoutSecretDocument,
      variables: VARIABLES,
      fetchPolicy: 'no-cache',
    });
  });

  it('reveals nothing when the answer carries no data', async () => {
    const pick = vi.fn();
    expect(
      await fetchSecret(clientAnswering(undefined), EmployeePayoutSecretDocument, VARIABLES, pick),
    ).toBe('');
    expect(pick).not.toHaveBeenCalled();
  });
});

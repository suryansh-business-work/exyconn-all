import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { ClientSharedKind } from '@/graphql/generated';
import { SharedItemSignature } from '@/components/clients/SharedItemSignature';

const renderSignature = (item: Parameters<typeof SharedItemSignature>[0]['item']) =>
  render(
    <MockedProvider mocks={[]}>
      <span data-testid="signature">
        <SharedItemSignature item={item} />
      </span>
    </MockedProvider>,
  );

describe('SharedItemSignature', () => {
  it('names who signed a contract and when', () => {
    renderSignature({
      kind: ClientSharedKind.Contract,
      signedAt: '2026-02-01T00:00:00.000Z',
      signedBy: 'Dana Reyes',
    });

    expect(screen.getByTestId('signature')).toHaveTextContent(/^Signed by Dana Reyes on .*2026/);
  });

  it('says an unsigned contract is not signed yet', () => {
    renderSignature({ kind: ClientSharedKind.Contract, signedAt: null, signedBy: null });

    expect(screen.getByTestId('signature')).toHaveTextContent('Not signed yet');
  });

  it('keeps the name blank when a signature carries none', () => {
    renderSignature({ kind: ClientSharedKind.Contract, signedAt: '2026-02-01T00:00:00.000Z' });

    expect(screen.getByTestId('signature')).toHaveTextContent(/^Signed by on /);
  });

  it('says nothing for documents and policies, which are not signed', () => {
    renderSignature({ kind: ClientSharedKind.Policy, signedAt: null });

    expect(screen.getByTestId('signature')).toBeEmptyDOMElement();
  });
});

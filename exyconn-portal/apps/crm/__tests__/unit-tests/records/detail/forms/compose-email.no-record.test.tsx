import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ComposeEmailForm } from '../../../../../src/records/detail/forms/compose-email';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ senderQuery: vi.fn(() => ({ data: undefined })) }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendCrmEmailMutation: () => [vi.fn()],
  useDraftCrmEmailMutation: () => [vi.fn(), { loading: false }],
  useCrmEmailSendersQuery: () => ({
    data: { crmEmailSenders: [{ id: 'mb-1', email: 'sales@example.com', provider: 'GMAIL' }] },
    loading: false,
  }),
  useCrmEmailSenderQuery: gql.senderQuery,
}));

const renderWith = (id: string) =>
  renderWithProviders(
    <ComposeEmailForm
      context={{ object: 'CONTACT', id, to: ['ada@example.com'], cc: ['ops@example.com'] }}
      onDone={vi.fn()}
      onCancel={vi.fn()}
    />,
  );

describe('ComposeEmailForm with or without a record', () => {
  it('starts with the copied addresses and offers the AI draft for a record', () => {
    renderWith('c-1');

    expect(screen.getByText('ops@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Draft with AI' })).toBeInTheDocument();
    expect(gql.senderQuery).toHaveBeenLastCalledWith(expect.objectContaining({ skip: false }));
  });

  it('leaves out the AI draft and the record sender lookup for an email about no record', () => {
    renderWith('');

    expect(screen.queryByRole('button', { name: 'Draft with AI' })).not.toBeInTheDocument();
    expect(gql.senderQuery).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }));
  });
});

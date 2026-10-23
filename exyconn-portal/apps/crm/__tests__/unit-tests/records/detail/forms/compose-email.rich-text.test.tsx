import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComposeEmailForm } from '../../../../../src/records/detail/forms/compose-email';
import {
  textToHtml,
  withQuote,
} from '../../../../../src/records/detail/forms/compose-email/emailHtml';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendCrmEmailMutation: () => [gql.send],
  useDraftCrmEmailMutation: () => [vi.fn(), { loading: false }],
  useCrmEmailSendersQuery: () => ({
    data: { crmEmailSenders: [{ id: 'mb-1', email: 'sales@example.com', provider: 'GMAIL' }] },
    loading: false,
  }),
  useCrmEmailSenderQuery: () => ({ data: undefined }),
}));

describe('emailHtml', () => {
  it('turns plain text into escaped paragraphs with its line breaks', () => {
    expect(textToHtml('Hi <Asha>,\nthanks.\n\nRavi & team')).toBe(
      '<p>Hi &lt;Asha&gt;,<br>thanks.</p><p>Ravi &amp; team</p>',
    );
  });

  it('quotes the earlier mail under the message, or leaves the message alone', () => {
    expect(withQuote('<p>Sure</p>', 'On Mon, Asha wrote:\nHi')).toBe(
      '<p>Sure</p><blockquote><p>On Mon, Asha wrote:<br>Hi</p></blockquote>',
    );
    expect(withQuote('<p>Sure</p>')).toBe('<p>Sure</p>');
  });
});

describe('ComposeEmailForm in rich text', () => {
  it('folds the quoted mail behind the dots and sends HTML with the quote under the reply', async () => {
    gql.send.mockResolvedValue({});
    const onDone = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ComposeEmailForm
        context={{
          object: 'CONTACT',
          id: '',
          to: ['asha@acme.test'],
          subject: 'Re: Pricing',
          body: '<p>Sounds good</p>',
          quote: 'On Mon, Asha wrote:\nCan you share the price list?',
          threadId: 't1',
          fromAccountId: 'mb-1',
        }}
        onDone={onDone}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Asha wrote/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show quoted text' }));
    expect(screen.getByText(/Asha wrote/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(gql.send).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          html: true,
          threadId: 't1',
          body: '<p>Sounds good</p><blockquote><p>On Mon, Asha wrote:<br>Can you share the price list?</p></blockquote>',
        }),
      },
    });
  });
});

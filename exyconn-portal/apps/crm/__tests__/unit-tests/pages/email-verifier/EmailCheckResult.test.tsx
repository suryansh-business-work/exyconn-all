import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { EmailVerificationStatus } from '@exyconn/shell/graphql/generated';
import { EmailCheckResult } from '../../../../src/pages/email-verifier/EmailCheckResult';
import { renderWithProviders } from '../../test-utils';
import { verification } from './email-verifier-fixtures';

/** Each fact label with the Yes/No beside it, in order. */
function facts(): string[] {
  const list = document.querySelector('dl');
  if (!list) throw new Error('No facts list');
  const terms = within(list).getAllByRole('term');
  const answers = within(list).getAllByRole('definition');
  return terms.map((term, index) => `${term.textContent}: ${answers[index].textContent}`);
}

describe('EmailCheckResult', () => {
  it('shows the address, its badge, why, and each check in plain words', () => {
    renderWithProviders(<EmailCheckResult result={verification({ roleAccount: true })} />);

    expect(screen.getByRole('heading', { name: 'asha@acme.com' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /^Verified: / })).toBeInTheDocument();
    expect(screen.getByText('The mailbox exists')).toBeInTheDocument();
    expect(facts()).toEqual([
      'Well-formed address: Yes',
      'Domain receives email: Yes',
      'Mailbox exists: Yes',
      'Domain accepts any address: No',
      'Disposable address: No',
      'Role address (info@, sales@ …): Yes',
    ]);
    expect(screen.getByText(/^Checked .+ by Priya$/)).toBeInTheDocument();
  });

  it('offers the likely intended address when the server suggests one', () => {
    renderWithProviders(
      <EmailCheckResult
        result={verification({
          email: 'asha@gmial.com',
          status: EmailVerificationStatus.Invalid,
          suggestion: 'asha@gmail.com',
        })}
      />,
    );

    expect(screen.getByText('Did you mean asha@gmail.com?')).toBeInTheDocument();
  });

  it('leaves out the reason and suggestion lines when there are none', () => {
    renderWithProviders(<EmailCheckResult result={verification({ reason: '' })} />);

    expect(screen.queryByText('The mailbox exists')).not.toBeInTheDocument();
    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });
});

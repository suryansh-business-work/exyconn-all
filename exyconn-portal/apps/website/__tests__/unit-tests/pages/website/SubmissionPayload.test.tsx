import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SubmissionPayload } from '../../../../src/pages/website/SubmissionPayload';
import { renderWithProviders } from '../../test-utils';

describe('SubmissionPayload', () => {
  it('lists each filled-in field with its label, linking emails and phone numbers', () => {
    renderWithProviders(
      <SubmissionPayload
        data={{
          fullName: 'Ravi K',
          email: 'ravi@example.com',
          phone: '+91 98765 43210',
          notes: '',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'What they sent' })).toBeInTheDocument();
    expect(screen.getByText('Full name')).toBeInTheDocument();
    expect(screen.getByText('Ravi K')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ravi@example.com' })).toHaveAttribute(
      'href',
      'mailto:ravi@example.com',
    );
    expect(screen.getByRole('link', { name: '+91 98765 43210' })).toHaveAttribute(
      'href',
      'tel:+919876543210',
    );
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('says so when nothing was captured', () => {
    renderWithProviders(<SubmissionPayload data={null} />);

    expect(screen.getByText('No payload captured for this submission.')).toBeInTheDocument();
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });
});

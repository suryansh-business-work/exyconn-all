import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicantDetailDialog } from '../../../../src/pages/applicants/ApplicantDetailDialog';
import { renderWithProviders } from '../../test-utils';
import { applicantRow } from './applicant-fixture';

describe('ApplicantDetailDialog', () => {
  it('renders nothing while no applicant is being viewed', () => {
    renderWithProviders(<ApplicantDetailDialog applicant={null} onClose={vi.fn()} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows who applied, for what, how they rate and everything they sent', () => {
    renderWithProviders(<ApplicantDetailDialog applicant={applicantRow()} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByText('SCREENING')).toBeInTheDocument();
    expect(screen.getByText('WEBSITE')).toBeInTheDocument();
    expect(screen.getByText('★★★★☆ · applied 04 Mar 2026')).toBeInTheDocument();
    expect(screen.getByText('Sales manager')).toBeInTheDocument();
    expect(screen.getByText('GRP-SM-001 · acme')).toBeInTheDocument();
    expect(screen.getByText('asha@example.com · +91 98765 43210')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'https://files.example.com/asha.pdf' }),
    ).toHaveAttribute('href', 'https://files.example.com/asha.pdf');
    expect(screen.getByText('I would love to join.')).toBeInTheDocument();
    expect(screen.getByText('Strong first call.')).toBeInTheDocument();
  });

  it('says what is missing instead of leaving blanks', () => {
    const bare = applicantRow({
      jobTitle: '',
      jobCode: '',
      phone: '',
      resumeUrl: '',
      coverLetter: '',
      notes: '',
      rating: 0,
    });
    renderWithProviders(<ApplicantDetailDialog applicant={bare} onClose={vi.fn()} />);

    expect(screen.getByText('No job title')).toBeInTheDocument();
    expect(screen.getByText('acme')).toBeInTheDocument();
    expect(screen.getByText('asha@example.com')).toBeInTheDocument();
    expect(screen.getByText('— · applied 04 Mar 2026')).toBeInTheDocument();
    expect(screen.getByText('No resume attached')).toBeInTheDocument();
    expect(screen.getByText('No cover letter')).toBeInTheDocument();
    expect(screen.getByText('Nothing recorded yet')).toBeInTheDocument();
  });

  it('shows a resume that arrived as a file name as plain text, not a link', () => {
    const emailed = applicantRow({ resumeUrl: 'asha-cv.pdf' });
    renderWithProviders(<ApplicantDetailDialog applicant={emailed} onClose={vi.fn()} />);

    expect(screen.getByText('asha-cv.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('closes from the panel close button', async () => {
    const onClose = vi.fn();
    renderWithProviders(<ApplicantDetailDialog applicant={applicantRow()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

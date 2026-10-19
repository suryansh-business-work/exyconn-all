import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyProfile } from '../../../../../src/pages/companies/detail/CompanyProfile';
import { renderWithProviders } from '../../../test-utils';
import { companyRow } from '../../../fixtures';
import { fieldValue } from '../../record-detail-stubs';

vi.mock('../../../../../src/records/detail', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/records/detail')>()),
  ...(await import('../../record-detail-stubs')).detailStubs,
}));

vi.mock('../../../../../src/records/comms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/records/comms')>()),
  ReachOutActions: (await import('../../record-detail-stubs')).ReachOutStub,
}));

vi.mock('../../../../../src/maps/GoogleMapCard', async () => ({
  GoogleMapCard: (await import('../../record-detail-stubs')).MapCardStub,
}));

vi.mock('../../../../../src/email-verification/EmailVerifyButton', async () => ({
  EmailVerifyButton: (await import('../../record-detail-stubs')).VerifyButtonStub,
}));

vi.mock('../../../../../src/pages/companies/forms/company', async () => ({
  CompanyForm: (await import('../../../form-stub')).FormStub,
}));

type Company = ReturnType<typeof companyRow>;

function renderProfile(company: Company) {
  const onSaved = vi.fn();
  const { container } = renderWithProviders(<CompanyProfile company={company} onSaved={onSaved} />);
  return { onSaved, value: (label: string) => fieldValue(container, label) };
}

const filled = companyRow({
  status: 'CUSTOMER' as Company['status'],
  isClient: true,
  industry: '',
  size: '',
  employeeCount: 0,
  annualRevenue: 5_000_000,
  foundedYear: 1999,
  city: 'Pune',
  country: 'IN',
  timezone: 'Asia/Kolkata',
  tags: ['vip', 'saas'],
  phone: '+91 20 1234 5678',
  emails: [
    { __typename: 'CrmEmailAddress', address: 'ops@acme.io', label: 'Work', primary: false },
    { __typename: 'CrmEmailAddress', address: 'hello@acme.io', label: 'Main', primary: true },
  ],
  phones: [
    { __typename: 'CrmPhoneNumber', number: '+91 20 1234 5678', label: 'Office', primary: true },
  ],
});

describe('CompanyProfile', () => {
  it('heads the profile with the name, a link to the domain and the status', () => {
    renderProfile(companyRow());

    expect(screen.getByRole('heading', { level: 1, name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'acme.io' })).toHaveAttribute(
      'href',
      'https://acme.io',
    );
    expect(screen.getByText('PROSPECT')).toBeInTheDocument();
    expect(screen.queryByText('Client')).not.toBeInTheDocument();
  });

  it('shows a placeholder for each fact that is not known', () => {
    const { value } = renderProfile(companyRow({ domain: '' }));

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(value('Email')).toBe('No email');
    expect(value('Phone')).toBe('No phone');
    expect(value('Industry')).toBe('Software');
    expect(value('Size')).toBe('11-50 people');
    expect(value('Employees')).toBe('No employee count');
    expect(value('Annual revenue')).toBe('No annual revenue');
    expect(value('Founded')).toBe('No founding year');
    expect(value('Local time')).toBe('No time zone');
  });

  it('falls back to the free-text location when there is no city or country', () => {
    const { value } = renderProfile(companyRow({ location: 'Pune' }));

    expect(value('Location')).toBe('Pune');
  });

  it('names the country alone when only the country is known', () => {
    const { value } = renderProfile(companyRow({ country: 'IN', location: 'ignored' }));

    expect(value('Location')).toBe('India');
  });

  it('shows every known fact, keeping zero employees as a real count', () => {
    const { value } = renderProfile(filled);

    expect(value('Industry')).toBe('No industry');
    expect(value('Size')).toBe('No size');
    expect(value('Employees')).toBe('0');
    expect(value('Annual revenue')).toMatch(/5[\d,.\s]*000/);
    expect(value('Founded')).toBe('1999');
    expect(value('Location')).toBe('Pune, India');
    expect(value('Local time')).toContain('(Asia/Kolkata)');
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
  });

  it('lists the primary address first, each with its own Verify control', () => {
    const { value } = renderProfile(filled);

    expect(value('Email')).toBe(
      'hello@acme.ioMainPrimaryverify hello@acme.ioops@acme.ioWorkverify ops@acme.io',
    );
    expect(screen.getByRole('link', { name: 'hello@acme.io' })).toHaveAttribute(
      'href',
      'mailto:hello@acme.io',
    );
    expect(screen.getByRole('link', { name: '+91 20 1234 5678' })).toHaveAttribute(
      'href',
      'tel:+91 20 1234 5678',
    );
  });

  it('hands the tags, quick actions, reach-out and map the company itself', () => {
    renderProfile(filled);

    expect(screen.getByText('Tags of company-1: vip, saas')).toBeInTheDocument();
    expect(screen.getByText('Actions for COMPANY company-1 Acme')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Reach COMPANY company-1 Acme: +91 20 1234 5678, ops@acme.io, hello@acme.io',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Map of Acme')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reach out' })).not.toBeInTheDocument();
  });

  it('edits the company in a dialog and reports the save', async () => {
    const { onSaved } = renderProfile(companyRow());

    await userEvent.click(screen.getByRole('button', { name: 'Edit company' }));
    expect(screen.getByText(/"id":"company-1"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(onSaved).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Edit company' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});

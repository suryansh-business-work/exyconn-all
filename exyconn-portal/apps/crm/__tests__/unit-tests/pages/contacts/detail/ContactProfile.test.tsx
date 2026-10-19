import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactProfile } from '../../../../../src/pages/contacts/detail/ContactProfile';
import { renderWithProviders } from '../../../test-utils';
import { contactRow } from '../../../fixtures';
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

vi.mock('../../../../../src/pages/contacts/forms/contact', async () => ({
  ContactForm: (await import('../../../form-stub')).FormStub,
}));

type Contact = ReturnType<typeof contactRow>;

function renderProfile(contact: Contact) {
  const onSaved = vi.fn();
  const { container } = renderWithProviders(<ContactProfile contact={contact} onSaved={onSaved} />);
  return { onSaved, value: (label: string) => fieldValue(container, label) };
}

describe('ContactProfile', () => {
  it('heads the profile with the name, role, lifecycle stage and status', () => {
    renderProfile(contactRow());

    expect(screen.getByRole('heading', { level: 1, name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByText('CTO · Acme')).toBeInTheDocument();
    expect(screen.getByText('LEAD')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('shows only the part of the role that is known', () => {
    renderProfile(contactRow({ title: '' }));
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('leaves out the role line when neither title nor company is known', () => {
    renderProfile(contactRow({ title: '', companyName: '' }));
    expect(screen.queryByText('·', { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText('CTO')).not.toBeInTheDocument();
  });

  it('shows a placeholder for each way to reach them that is not known', () => {
    const { value } = renderProfile(contactRow({ emails: [], title: '' }));

    expect(value('Email')).toBe('No email');
    expect(value('Phone')).toBe('No phone');
    expect(value('Job title')).toBe('No job title');
    expect(value('Location')).toBe('No location');
    expect(value('Local time')).toBe('No time zone');
    expect(value('Languages')).toBe('No languages');
    expect(value('LinkedIn')).toBe('No LinkedIn profile');
    expect(value('X (Twitter)')).toBe('No X account');
  });

  it('shows everything known, linking the social profiles out', () => {
    const { value } = renderProfile(
      contactRow({
        phones: [
          {
            __typename: 'CrmPhoneNumber',
            number: '+91 98 7654 3210',
            label: 'Mobile',
            primary: true,
          },
        ],
        city: 'Pune',
        country: 'IN',
        timezone: 'Asia/Kolkata',
        languages: ['English', 'Hindi'],
        linkedinUrl: 'https://linkedin.com/in/asha',
        twitterUrl: 'https://x.com/asha',
      }),
    );

    expect(value('Email')).toBe('asha@acme.ioWorkPrimaryverify asha@acme.io');
    expect(screen.getByRole('link', { name: '+91 98 7654 3210' })).toHaveAttribute(
      'href',
      'tel:+91 98 7654 3210',
    );
    expect(value('Job title')).toBe('CTO');
    expect(value('Location')).toBe('Pune, India');
    expect(value('Local time')).toContain('(Asia/Kolkata)');
    expect(value('Languages')).toBe('English, Hindi');
    expect(screen.getByRole('link', { name: 'https://linkedin.com/in/asha' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/asha',
    );
    expect(screen.getByRole('link', { name: 'https://x.com/asha' })).toHaveAttribute(
      'target',
      '_blank',
    );
  });

  it('names the country alone when only the country is known', () => {
    const { value } = renderProfile(contactRow({ country: 'IN' }));

    expect(value('Location')).toBe('India');
  });

  it('hands the tags, quick actions, reach-out and map the contact itself', () => {
    renderProfile(contactRow({ tags: ['champion'], phone: '+91 98 7654 3210' }));

    expect(screen.getByText('Tags of contact-1: champion')).toBeInTheDocument();
    expect(screen.getByText('Actions for CONTACT contact-1 Asha Rao')).toBeInTheDocument();
    expect(
      screen.getByText('Reach CONTACT contact-1 Asha Rao: +91 98 7654 3210, asha@acme.io'),
    ).toBeInTheDocument();
    expect(screen.getByText('Map of Asha Rao')).toBeInTheDocument();
  });

  it('edits the contact in a dialog and reports only a save', async () => {
    const { onSaved } = renderProfile(contactRow());

    await userEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
    expect(screen.getByText(/"id":"contact-1"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(onSaved).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});

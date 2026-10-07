import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { ApplicantSource } from '@exyconn/shell/graphql/generated';
import {
  ApplicantForm,
  toApplicantValues,
  type ApplicantRow,
} from '../../../../../../src/pages/applicants/forms/applicant';
import { renderWithProviders } from '../../../../test-utils';
import { chooseOption, press, typeInto } from '../../../../harness/forms';
import { applicantRow } from '../../applicant-fixture';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateApplicantMutation: () => [gql.create],
  useUpdateApplicantMutation: () => [gql.update],
}));

function renderForm(initial: ApplicantRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<ApplicantForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('toApplicantValues', () => {
  it('starts a hand-added applicant as manual and unrated', () => {
    expect(toApplicantValues(null)).toMatchObject({
      name: '',
      email: '',
      source: ApplicantSource.Manual,
      rating: 0,
    });
  });
});

describe('ApplicantForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({});
    gql.update.mockReset().mockResolvedValue({});
  });

  it('asks for a name, an email and the job applied for', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Job title is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('checks the email, phone, company slug and resume link formats', async () => {
    renderForm();

    await typeInto('Email', 'asha@');
    await typeInto('Phone', 'call me');
    await typeInto('Company slug', 'Acme Corp');
    await typeInto('Resume link', 'ftp://files.example.com/cv.pdf');
    await press('Create');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument();
    expect(screen.getByText('Lower-case letters, numbers and hyphens only')).toBeInTheDocument();
    expect(screen.getByText('Enter a full URL starting with https://')).toBeInTheDocument();
  });

  it('keeps the name and job title to a sensible length', async () => {
    renderForm();

    fireEvent.change(screen.getByRole('textbox', { name: 'Full name' }), {
      target: { value: 'A'.repeat(81) },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Job title' }), {
      target: { value: 'J'.repeat(121) },
    });
    await press('Create');

    expect(await screen.findByText('Keep the name under 80 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the title short')).toBeInTheDocument();
  });

  it('adds an applicant by hand with the source and rating picked', async () => {
    const { onDone } = renderForm();

    await typeInto('Full name', 'Bo Chen');
    await typeInto('Email', 'bo@example.com');
    await typeInto('Job title', 'Account executive');
    await chooseOption('Source', 'Referral');
    await chooseOption('Rating', '4 — Strong');
    await press('Create');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'Bo Chen',
            email: 'bo@example.com',
            phone: '',
            jobCode: '',
            jobTitle: 'Account executive',
            companySlug: '',
            resumeUrl: '',
            coverLetter: '',
            source: ApplicantSource.Referral,
            rating: 4,
          },
        },
      }),
    );
    expect(await screen.findByText('Applicant created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('corrects an applicant by id, sending only the details the form owns', async () => {
    const row = applicantRow();
    const { onDone } = renderForm(row);

    await typeInto('Phone', '+44 20 7946 0958');
    await press('Update');

    await waitFor(() =>
      expect(gql.update).toHaveBeenCalledWith({
        variables: {
          id: 'applicant-1',
          input: {
            name: 'Asha Rao',
            email: 'asha@example.com',
            phone: '+44 20 7946 0958',
            jobCode: 'GRP-SM-001',
            jobTitle: 'Sales manager',
            companySlug: 'acme',
            resumeUrl: 'https://files.example.com/asha.pdf',
            coverLetter: 'I would love to join.',
            source: ApplicantSource.Website,
            rating: 4,
          },
        },
      }),
    );
    expect(await screen.findByText('Applicant updated')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('says why the save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('That email has already applied'));
    const { onDone } = renderForm(applicantRow());

    await press('Update');

    expect(await screen.findByText('That email has already applied')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

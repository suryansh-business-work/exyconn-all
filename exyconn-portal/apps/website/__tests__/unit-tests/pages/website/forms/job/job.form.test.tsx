import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobForm, type JobRow } from '../../../../../../src/pages/website/forms/job';
import { renderWithProviders } from '../../../../test-utils';
import { renderInSite } from '../../../cms/cms-helpers';
import { field, pickOption } from '../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), companies: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateJobMutation: () => [gql.create],
  useUpdateJobMutation: () => [gql.update],
  useListJobCompaniesQuery: () => gql.companies(),
}));

vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const { BoundFieldStub } = await import('../form-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfRichText: BoundFieldStub,
    RhfDatePicker: BoundFieldStub,
  };
});

const jobValues = {
  jobCode: 'JOB-001',
  companySlug: 'exyconn',
  title: 'Frontend engineer',
  category: 'Engineering',
  skillSet: ['React'],
  shortJobDescription: 'Build portals',
  jobDescription: '<p>About the role</p>',
  jobResponsibilities: '<p>Ship</p>',
  requirements: ['3 years'],
  niceToHave: ['GraphQL'],
  benefits: ['Remote'],
  location: 'Bengaluru',
  jobType: 'Full Time',
  experienceLevel: 'Mid Level',
  workMode: 'Hybrid',
  salaryRange: '₹20-30L',
  jobPostDate: '2026-04-01T00:00:00.000Z',
  isActive: true,
  isFeatured: false,
};

const job: JobRow = { id: 'job-1', siteId: 'site-1', ...jobValues, applicationDeadline: null };

const handlers = () => ({ onDone: vi.fn(), onCancel: vi.fn() });

describe('JobForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
    gql.companies.mockReset().mockReturnValue({
      data: { listJobCompanies: [{ name: 'Exyconn', slug: 'exyconn' }] },
    });
  });

  it('creates a job on the current site with unset dates sent as null', async () => {
    gql.create.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderInSite(<JobForm initial={null} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    expect(screen.getByText('Placement')).toBeInTheDocument();
    expect(screen.getByText('Candidate profile')).toBeInTheDocument();
    await user.type(field('Job code'), 'JOB-002');
    await pickOption(user, 'Company', 'Exyconn');
    await user.type(field('Title'), 'Designer');
    await pickOption(user, 'Category', 'Design');
    await pickOption(user, 'Job type', 'Contract');
    await pickOption(user, 'Experience level', 'Senior');
    await pickOption(user, 'Work mode', 'Remote');
    await user.type(screen.getByRole('combobox', { name: 'Skill set' }), 'Figma{Enter}');
    await user.click(screen.getByLabelText('Featured'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          jobCode: 'JOB-002',
          companySlug: 'exyconn',
          title: 'Designer',
          category: 'Design',
          skillSet: ['Figma'],
          shortJobDescription: '',
          jobDescription: '',
          jobResponsibilities: '',
          requirements: [],
          niceToHave: [],
          benefits: [],
          location: '',
          jobType: 'Contract',
          experienceLevel: 'Senior',
          workMode: 'Remote',
          salaryRange: '',
          jobPostDate: null,
          applicationDeadline: null,
          isActive: true,
          isFeatured: true,
          siteId: 'site-1',
        },
      },
    });
    expect(await screen.findByText('Job created')).toBeInTheDocument();
  });

  it('names every required field, even before the companies load', async () => {
    gql.companies.mockReturnValue({ data: undefined });
    const { onDone, onCancel } = handlers();
    renderWithProviders(<JobForm initial={null} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Job code is required')).toBeInTheDocument();
    for (const message of [
      'Company is required',
      'Title is required',
      'Category is required',
      'Job type is required',
      'Experience level is required',
      'Work mode is required',
    ]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('updates a job, keeping its post date and sending no deadline', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderWithProviders(<JobForm initial={job} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    expect(field('Job description')).toHaveValue('<p>About the role</p>');
    expect(field('Application deadline')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'job-1', input: { ...jobValues, applicationDeadline: null } },
    });
    expect(await screen.findByText('Job updated')).toBeInTheDocument();
  });

  it('sends a deadline once one is picked', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderWithProviders(<JobForm initial={job} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.type(field('Application deadline'), '2026-06-30T00:00:00.000Z');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'job-1',
        input: { ...jobValues, applicationDeadline: '2026-06-30T00:00:00.000Z' },
      },
    });
  });

  it('shows why the save failed', async () => {
    gql.update.mockRejectedValue(new Error('Job code already used'));
    const { onDone, onCancel } = handlers();
    renderWithProviders(<JobForm initial={job} onDone={onDone} onCancel={onCancel} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Job code already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});

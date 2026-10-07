import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  JobCompanyForm,
  type JobCompanyRow,
} from '../../../../../../src/pages/website/forms/job-company';
import { renderWithProviders } from '../../../../test-utils';
import { renderInSite } from '../../../cms/cms-helpers';
import { field } from '../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateJobCompanyMutation: () => [gql.create],
  useUpdateJobCompanyMutation: () => [gql.update],
}));

vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const { BoundFieldStub } = await import('../form-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfRichText: BoundFieldStub,
  };
});

const companyValues = {
  companyCode: 'CMP-001',
  slug: 'exyconn',
  name: 'Exyconn',
  logo: '/logo.svg',
  tagline: 'AI that does the work',
  description: '<p>About</p>',
  culture: '<p>Culture</p>',
  website: 'https://exyconn.com',
  founded: '2020',
  employees: '50',
  industry: 'Software',
  headquarters: 'Bengaluru',
  benefits: [{ icon: 'home', title: 'Remote', description: 'Work anywhere' }],
  socialLinks: {
    linkedin: 'https://linkedin.com/company/exyconn',
    twitter: '',
    facebook: '',
    instagram: '',
  },
  brandColor: '#f9851f',
  secondaryColor: '',
  isActive: true,
  order: 1,
};

const company: JobCompanyRow = { id: 'cmp-1', siteId: 'site-1', ...companyValues };

const EMPTY_LINKS = { linkedin: '', twitter: '', facebook: '', instagram: '' };

const handlers = () => ({ onDone: vi.fn(), onCancel: vi.fn() });

describe('JobCompanyForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
  });

  it('creates a company on the current site with a benefit', async () => {
    gql.create.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderInSite(<JobCompanyForm initial={null} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    expect(screen.getByText('No benefits added yet.')).toBeInTheDocument();
    await user.type(field('Company code'), 'CMP-002');
    await user.type(field('Slug'), 'acme');
    await user.type(field('Name'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Add benefit' }));
    expect(screen.getByText('Benefit 1')).toBeInTheDocument();
    await user.type(field('Icon'), 'health');
    await user.type(field('Title'), 'Insurance');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          companyCode: 'CMP-002',
          slug: 'acme',
          name: 'Acme',
          logo: '',
          tagline: '',
          description: '',
          culture: '',
          website: '',
          founded: '',
          employees: '',
          industry: '',
          headquarters: '',
          benefits: [{ icon: 'health', title: 'Insurance', description: '' }],
          socialLinks: EMPTY_LINKS,
          brandColor: '',
          secondaryColor: '',
          isActive: true,
          order: 0,
          siteId: 'site-1',
        },
      },
    });
    expect(await screen.findByText('Company created')).toBeInTheDocument();
  });

  it('requires the identity fields and a complete benefit', async () => {
    const { onDone, onCancel } = handlers();
    renderWithProviders(<JobCompanyForm initial={null} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Add benefit' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Company code is required')).toBeInTheDocument();
    expect(screen.getByText('Slug is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Icon is required')).toBeInTheDocument();
    expect(screen.getByText('Benefit title is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects malformed links, colours and order', async () => {
    const { onDone, onCancel } = handlers();
    renderWithProviders(<JobCompanyForm initial={company} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.clear(field('Slug'));
    await user.type(field('Slug'), 'Exy Conn');
    await user.clear(field('Logo URL'));
    await user.type(field('Logo URL'), 'logo.svg');
    await user.clear(field('Website'));
    await user.type(field('Website'), 'exyconn.com');
    await user.type(field('Twitter'), 'twitter.com/exyconn');
    await user.type(field('Secondary color'), 'blue');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Order' }), {
      target: { value: '-1' },
    });
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('Lower-case letters, numbers and hyphens only'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter a full URL or a path starting with /')).toBeInTheDocument();
    expect(screen.getAllByText('Enter a full URL starting with https://')).toHaveLength(2);
    expect(screen.getByText('Use a 6-digit hex colour, e.g. #f9851f')).toBeInTheDocument();
    expect(screen.getByText('Order must be ≥ 0')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('updates a company after removing its benefit', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderWithProviders(<JobCompanyForm initial={company} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    expect(field('Icon')).toHaveValue('home');
    await user.click(screen.getByRole('button', { name: 'Remove benefit 1' }));
    expect(screen.getByText('No benefits added yet.')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Active'));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'cmp-1', input: { ...companyValues, benefits: [], isActive: false } },
    });
    expect(await screen.findByText('Company updated')).toBeInTheDocument();
  });

  it('shows why the save failed', async () => {
    gql.update.mockRejectedValue(new Error('Slug already used'));
    const { onDone, onCancel } = handlers();
    renderWithProviders(<JobCompanyForm initial={company} onDone={onDone} onCancel={onCancel} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Slug already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});

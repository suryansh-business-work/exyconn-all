import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GigForm, type GigRow } from '../../../../../../src/pages/website/forms/gig';
import { renderWithProviders } from '../../../../test-utils';
import { field, pickOption } from '../form-helpers';
import { renderInSite } from '../../../cms/cms-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateGigMutation: () => [gql.create],
  useUpdateGigMutation: () => [gql.update],
}));

vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const { BoundFieldStub } = await import('../form-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfRichText: BoundFieldStub,
    RhfDatePicker: BoundFieldStub,
  };
});

const gigValues = {
  gigCode: 'GIG-001',
  title: 'Landing page build',
  category: 'Development',
  shortDescription: 'Build a page',
  fullDescription: '<p>Details</p>',
  deliverables: ['Figma to code'],
  requirements: ['React'],
  tags: ['web'],
  budget: '₹25,000',
  duration: '1-2 weeks',
  status: 'open',
  applicationType: 'email',
  applicationContact: 'gigs@example.com',
  postedDate: '2026-04-01T00:00:00.000Z',
  isUrgent: false,
};

const gig: GigRow = { id: 'gig-1', siteId: 'site-1', ...gigValues, deadline: null };

function handlers() {
  return { onDone: vi.fn(), onCancel: vi.fn() };
}

describe('GigForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
  });

  it('creates a gig on the current site, sending unset dates as null', async () => {
    gql.create.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderInSite(<GigForm initial={null} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.type(field('Gig code'), 'GIG-002');
    await user.type(field('Title'), 'Logo design');
    await pickOption(user, 'Category', 'Design');
    await pickOption(user, 'Duration', '< 1 week');
    await pickOption(user, 'Status', 'open');
    await pickOption(user, 'Application type', 'whatsapp');
    await user.type(field('Application contact'), '+91 98765 43210');
    await user.type(screen.getByRole('combobox', { name: 'Tags' }), 'branding{Enter}');
    await user.click(screen.getByLabelText('Urgent'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          gigCode: 'GIG-002',
          title: 'Logo design',
          category: 'Design',
          shortDescription: '',
          fullDescription: '',
          deliverables: [],
          requirements: [],
          tags: ['branding'],
          budget: '',
          duration: '< 1 week',
          status: 'open',
          applicationType: 'whatsapp',
          applicationContact: '+91 98765 43210',
          postedDate: null,
          deadline: null,
          isUrgent: true,
          siteId: 'site-1',
        },
      },
    });
    expect(await screen.findByText('Gig created')).toBeInTheDocument();
  });

  it('names every required field when submitted empty', async () => {
    const { onDone, onCancel } = handlers();
    renderWithProviders(<GigForm initial={null} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Gig code is required')).toBeInTheDocument();
    for (const message of [
      'Title is required',
      'Category is required',
      'Duration is required',
      'Status is required',
      'Application type is required',
      'Application contact is required',
    ]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('updates a gig, keeping its posted date and sending no deadline', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderWithProviders(<GigForm initial={gig} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    expect(field('Posted date')).toHaveValue('2026-04-01T00:00:00.000Z');
    expect(field('Deadline')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'gig-1', input: { ...gigValues, deadline: null } },
    });
    expect(await screen.findByText('Gig updated')).toBeInTheDocument();
  });

  it('shows why the save failed', async () => {
    gql.update.mockRejectedValue(new Error('Gig code already used'));
    const { onDone, onCancel } = handlers();
    renderWithProviders(<GigForm initial={gig} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Gig code already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels', async () => {
    const { onDone, onCancel } = handlers();
    renderWithProviders(<GigForm initial={null} onDone={onDone} onCancel={onCancel} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

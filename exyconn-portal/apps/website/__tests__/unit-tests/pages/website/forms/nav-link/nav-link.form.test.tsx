import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavLinkForm, type NavLinkRow } from '../../../../../../src/pages/website/forms/nav-link';
import { renderWithProviders } from '../../../../test-utils';
import { renderInSite } from '../../../cms/cms-helpers';
import { field, pickOption } from '../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateNavLinkMutation: () => [gql.create],
  useUpdateNavLinkMutation: () => [gql.update],
}));

const linkValues = {
  label: 'AI consulting',
  href: '/services/ai-consulting',
  description: 'Talk to us',
  category: 'Services',
  keywords: 'ai, consulting',
  isActive: true,
  order: 2,
};

const link: NavLinkRow = { id: 'nav-1', siteId: 'site-1', ...linkValues };

function handlers() {
  return { onDone: vi.fn(), onCancel: vi.fn() };
}

describe('NavLinkForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
  });

  it('creates an active link on the current site', async () => {
    gql.create.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderInSite(<NavLinkForm initial={null} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.type(field('Label'), 'Careers');
    await user.type(field('Link URL'), 'https://example.com/careers');
    await pickOption(user, 'Category', 'Company');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Order' }), { target: { value: '5' } });
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Careers',
          href: 'https://example.com/careers',
          description: '',
          category: 'Company',
          keywords: '',
          isActive: true,
          order: 5,
          siteId: 'site-1',
        },
      },
    });
    expect(await screen.findByText('Nav link created')).toBeInTheDocument();
  });

  it('requires a label, a link and a category', async () => {
    const { onDone, onCancel } = handlers();
    renderWithProviders(<NavLinkForm initial={null} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Label is required')).toBeInTheDocument();
    expect(screen.getByText('Link URL is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a link that is neither a URL nor a path, and a negative order', async () => {
    const { onDone, onCancel } = handlers();
    renderWithProviders(<NavLinkForm initial={link} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.clear(field('Link URL'));
    await user.type(field('Link URL'), 'services page');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Order' }), {
      target: { value: '-1' },
    });
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('Enter a full URL or a path starting with /'),
    ).toBeInTheDocument();
    expect(screen.getByText('Must be ≥ 0')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('updates a link and can switch it off', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { onDone, onCancel } = handlers();
    renderWithProviders(<NavLinkForm initial={link} onDone={onDone} onCancel={onCancel} />);
    const user = userEvent.setup();

    expect(field('Label')).toHaveValue('AI consulting');
    await user.click(screen.getByLabelText('Active'));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'nav-1', input: { ...linkValues, isActive: false } },
    });
    expect(await screen.findByText('Nav link updated')).toBeInTheDocument();
  });

  it('shows why the save failed', async () => {
    gql.update.mockRejectedValue(new Error('Not allowed'));
    const { onDone, onCancel } = handlers();
    renderWithProviders(<NavLinkForm initial={link} onDone={onDone} onCancel={onCancel} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MarketingFooterForm } from '../../../../../../src/pages/preferences/forms/marketing-footer';
import { renderWithProviders } from '../../../../test-utils';
import { fill, press } from '../../../../form-helpers';
import { FOOTER } from '../../preferences.fixtures';

const gql = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveMarketingFooterMutation: () => [gql.save],
}));

function renderFooter() {
  const onSaved = vi.fn();
  renderWithProviders(<MarketingFooterForm initial={FOOTER} onSaved={onSaved} />);
  return { onSaved };
}

describe('MarketingFooterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.save.mockResolvedValue({ data: { saveMarketingFooter: FOOTER } });
  });

  it('starts from the saved footer and says what is always added', () => {
    renderFooter();

    expect(screen.getByLabelText(/^Company name/)).toHaveValue('Acme Corp');
    expect(screen.getByLabelText(/^Postal address/)).toHaveValue('12 Park Street, Kolkata');
    expect(screen.getByLabelText('Text colour')).toHaveValue('#6b7280');
    expect(
      screen.getByText(
        'Every marketing email ends with this footer, plus its Unsubscribe and Manage preferences links.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save footer' })).toBeInTheDocument();
  });

  it('saves the trimmed footer and keeps the saved values as the new baseline', async () => {
    const { onSaved } = renderFooter();
    fill('Company name *', '  Acme Ltd  ');
    fill('Website link', 'https://acme.io');
    fill('Link colour', '#2563eb');

    await press('Save footer');

    expect(await screen.findByText('Footer saved')).toBeInTheDocument();
    const saved = {
      ...FOOTER,
      companyName: 'Acme Ltd',
      websiteUrl: 'https://acme.io',
      linkColor: '#2563eb',
    };
    expect(gql.save).toHaveBeenCalledWith({ variables: { input: saved } });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/^Company name/)).toHaveValue('Acme Ltd');
  });

  it('needs a company name and a postal address', async () => {
    renderFooter();
    fill('Company name *', ' ');
    fill('Postal address *', '');

    await press('Save footer');

    expect(await screen.findByText('Add the company name')).toBeInTheDocument();
    expect(screen.getByText('Marketing law requires a postal address')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('caps the text fields at their length', async () => {
    renderFooter();
    fill('Company name *', 'c'.repeat(121));
    fill('Contact details', 'd'.repeat(201));
    fill('Postal address *', 'p'.repeat(301));

    await press('Save footer');

    expect(await screen.findByText('Keep it under 120 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep it under 200 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep it under 300 characters')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('wants full web addresses and hex colours', async () => {
    renderFooter();
    fill('Privacy policy link', 'acme.io/privacy');
    fill('Website link', 'ftp://acme.io');
    fill('Text colour', 'grey');
    fill('Link colour', '#12345');

    await press('Save footer');

    expect(
      await screen.findAllByText('Enter a full web address, starting with https://'),
    ).toHaveLength(2);
    expect(screen.getAllByText('Use a colour like #2563eb')).toHaveLength(2);
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('reports a failed save and keeps the edits', async () => {
    gql.save.mockRejectedValue(new Error('Not allowed'));
    const { onSaved } = renderFooter();
    fill('Contact details', 'sales@acme.io');

    await press('Save footer');

    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Contact details')).toHaveValue('sales@acme.io');
  });

  it('falls back to a plain message when the failure has none', async () => {
    gql.save.mockRejectedValue('boom');
    renderFooter();

    await press('Save footer');

    expect(await screen.findByText('The footer could not be saved')).toBeInTheDocument();
  });

  it('puts the saved footer back on Cancel', async () => {
    renderFooter();
    fill('Company name *', 'Somebody else');

    await press('Cancel');

    expect(screen.getByLabelText(/^Company name/)).toHaveValue('Acme Corp');
    expect(gql.save).not.toHaveBeenCalled();
  });
});

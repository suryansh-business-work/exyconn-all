import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupStep } from '../../../../../../../src/pages/marketing/forms/campaign/steps/SetupStep';
import {
  STEP_FIELDS,
  type CampaignStudioValues,
} from '../../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import { renderWithProviders } from '../../../../../test-utils';
import { chooseOption, optionsOf } from '../../../../../form-helpers';
import { StudioFormHarness, type StudioForm } from '../form-harness';
import { studioOptions } from '../studio.fixtures';
import { campaignRow } from '../../../../../fixtures';
import type { StudioOptions } from '../../../../../../../src/pages/marketing/forms/campaign/studio/useStudioOptions';
import type { CampaignRow } from '../../../../../../../src/pages/marketing/forms/campaign/campaign.types';

/** The MUI X pickers become plain inputs holding the ISO string the real ones store. */
vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const stubs = await import('../../../../../rhf-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfDatePicker: stubs.RhfValueStub,
  };
});

function renderStep({
  options = studioOptions(),
  campaign = null,
  values = {},
}: {
  options?: StudioOptions;
  campaign?: CampaignRow | null;
  values?: Partial<CampaignStudioValues>;
} = {}) {
  let form: StudioForm | undefined;
  renderWithProviders(
    <StudioFormHarness
      values={values}
      onForm={(value) => {
        form = value;
      }}
    >
      <SetupStep options={options} campaign={campaign} />
    </StudioFormHarness>,
  );
  return () => form as StudioForm;
}

const openAdvanced = () =>
  userEvent.click(screen.getByRole('button', { name: 'Advanced settings' }));

describe('SetupStep', () => {
  it('shows every setting with its hint', () => {
    renderStep();
    expect(screen.getByLabelText(/Internal campaign name/)).toBeRequired();
    expect(screen.getByLabelText(/Sender name/)).toBeRequired();
    expect(screen.getByLabelText(/Email subject/)).toBeRequired();
    expect(screen.getByLabelText('Reply-to email')).toHaveAttribute('type', 'email');
    expect(screen.getByText(/Only your team sees this/)).toBeInTheDocument();
    expect(screen.getByText(/Under 150 characters works best/)).toBeInTheDocument();
    expect(screen.queryByText(/No email configuration is active/)).not.toBeInTheDocument();
  });

  it('offers the campaign types, the categories and the verified senders', async () => {
    renderStep();
    expect(await optionsOf('Campaign type')).toEqual([
      'Newsletter',
      'Promotional',
      'Announcement',
      'Event',
      'Follow-up',
      'Other',
    ]);
    expect(await optionsOf('Marketing preference category')).toEqual([
      'General marketing (no category)',
      'Offers',
    ]);
    expect(await optionsOf('Verified sender email')).toEqual(['hello@exyconn.com']);
  });

  it('stores what is chosen', async () => {
    const form = renderStep();
    await chooseOption('Campaign type', 'Event');
    await chooseOption('Marketing preference category', 'Offers');
    expect(form().getValues(['campaignType', 'preferenceCategoryId'])).toEqual(['EVENT', 'cat-1']);
  });

  it('warns that nothing can be sent without a verified sender', () => {
    renderStep({ options: studioOptions({ verifiedSenders: [] }) });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No email configuration is active. Add one in Tech > Email before sending campaigns.',
    );
  });

  it('flags every missing or invalid setting before moving on', async () => {
    const form = renderStep({ values: { senderEmail: '' } });
    fireEvent.change(screen.getByLabelText('Reply-to email'), { target: { value: 'nope' } });
    await act(() => form().trigger(STEP_FIELDS.setup));
    for (const message of [
      'Name the campaign',
      'Add the name recipients see',
      'Choose a verified sender address',
      'Enter a valid email address',
      'Add a subject line',
    ]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  });

  it('keeps budget, period and tracking under Advanced settings', async () => {
    const form = renderStep();
    await openAdvanced();
    expect(
      screen.getByText('Optional, for reporting what the campaign cost; 0 or more.'),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText('Campaign starts'), {
      target: { value: '2026-11-01T00:00:00.000Z' },
    });
    await userEvent.click(screen.getByRole('switch', { name: 'Track link clicks' }));
    await userEvent.click(
      screen.getByRole('switch', { name: 'Estimate opens with a tracking image' }),
    );
    expect(form().getValues(['startDate', 'trackClicks', 'trackOpens'])).toEqual([
      '2026-11-01T00:00:00.000Z',
      false,
      false,
    ]);
  });

  it('takes the budget as an amount and a currency, in two fields', async () => {
    const form = renderStep();
    await openAdvanced();
    const amount = screen.getByLabelText(/^Budget amount\s*\*?$/);
    expect(amount).toHaveAttribute('type', 'number');
    expect(screen.getByRole('combobox', { name: /^Currency/ })).toHaveValue(
      'INR — Indian Rupee (₹)',
    );

    fireEvent.change(amount, { target: { value: '2500' } });
    await userEvent.click(screen.getByRole('combobox', { name: /^Currency/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: /^USD — / }),
    );

    expect(form().getValues(['budget', 'budgetCurrency'])).toEqual(['2500', 'USD']);
    expect(await act(() => form().trigger(['budget', 'budgetCurrency']))).toBe(true);
  });

  it('refuses a negative budget and a missing currency before moving on', async () => {
    const form = renderStep({ values: { budgetCurrency: '' } });
    await openAdvanced();
    fireEvent.change(screen.getByLabelText(/^Budget amount\s*\*?$/), {
      target: { value: '-5' },
    });

    await act(() => form().trigger(STEP_FIELDS.setup));

    expect(screen.getByText('The budget cannot be negative')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
  });

  it('names the Tech > Email template a campaign started from', async () => {
    renderStep({ campaign: campaignRow({ templateKey: 'welcome' }) });
    await openAdvanced();
    expect(
      screen.getByText('Started from the Tech > Email template “welcome”.'),
    ).toBeInTheDocument();
  });

  it('says nothing about a template for a campaign written from scratch', async () => {
    renderStep({ campaign: campaignRow({ templateKey: '' }) });
    await openAdvanced();
    expect(screen.queryByText(/Started from the Tech > Email template/)).not.toBeInTheDocument();
  });
});

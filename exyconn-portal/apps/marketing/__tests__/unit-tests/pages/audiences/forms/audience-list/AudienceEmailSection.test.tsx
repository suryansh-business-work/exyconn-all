import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceEmailSelection } from '@exyconn/shell/graphql/generated';
import { AudienceEmailSection } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceEmailSection';
import { renderWithProviders } from '../../../../test-utils';
import { chooseMany, optionsOf, press } from '../../../../form-helpers';
import { AudienceFormHarness, formProbe } from './audience-form-harness';

const MANY_INBOXES =
  'The same person may receive this campaign in several of their inboxes. Each address still gets one copy at most.';

function renderEmail(emailTypes: readonly string[] = ['Sales', 'Support']) {
  const probe = formProbe();
  renderWithProviders(
    <AudienceFormHarness capture={probe.capture}>
      <AudienceEmailSection emailTypes={emailTypes} />
    </AudienceFormHarness>,
  );
  return probe;
}

const pick = (label: RegExp) => userEvent.click(screen.getByRole('radio', { name: label }));

describe('AudienceEmailSection', () => {
  it('starts from one preferred address per record and says what is never sent to', () => {
    renderEmail();

    expect(screen.getByRole('radio', { name: /Preferred \/ primary email/ })).toBeChecked();
    expect(screen.queryByText(MANY_INBOXES)).toBeNull();
    expect(screen.queryByRole('combobox', { name: /Email types/ })).toBeNull();
    expect(
      screen.getByText(/Unsubscribed, blocked, bounced, and do-not-contact addresses/),
    ).toBeInTheDocument();
  });

  it('warns that one person may get several copies when every address is used', async () => {
    const probe = renderEmail();

    await pick(/All eligible email addresses/);

    expect(probe.values().emailSelection).toBe(AudienceEmailSelection.All);
    expect(screen.getByText(MANY_INBOXES)).toBeInTheDocument();
  });

  it('offers the labels in use when only selected types are used', async () => {
    const probe = renderEmail();

    await pick(/Selected email types/);

    expect(await optionsOf('Email types')).toEqual(['Sales', 'Support']);
    expect(
      screen.getByText('Only addresses with these labels are used, e.g. Sales or Support.'),
    ).toBeInTheDocument();
    await chooseMany('Email types', ['Support']);
    expect(probe.values().emailTypes).toEqual(['Support']);
    expect(screen.queryByText(MANY_INBOXES)).toBeNull();
  });

  it('asks for a type before the audience can be saved', async () => {
    renderEmail();
    await pick(/Selected email types/);

    await press('Check');

    expect(await screen.findByText('Choose at least one email type')).toBeInTheDocument();
  });

  it('says to label addresses first when the CRM has none', async () => {
    renderEmail([]);

    await pick(/Selected email types/);

    expect(
      screen.getByText(
        'No labelled addresses in the CRM yet — add labels to contact or company emails first.',
      ),
    ).toBeInTheDocument();
  });
});

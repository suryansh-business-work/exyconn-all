import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AudienceCompanyEmailSource,
  AudienceRecipientSource,
} from '@exyconn/shell/graphql/generated';
import { AudienceSourceSection } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceSourceSection';
import { renderWithProviders } from '../../../../test-utils';
import { AudienceFormHarness, formProbe } from './audience-form-harness';

function renderSource(source?: AudienceRecipientSource) {
  const probe = formProbe();
  renderWithProviders(
    <AudienceFormHarness values={source && { recipientSource: source }} capture={probe.capture}>
      <AudienceSourceSection />
    </AudienceFormHarness>,
  );
  return probe;
}

const toggle = (name: string) => screen.getByRole('button', { name });

describe('AudienceSourceSection', () => {
  it('offers the registers as one choice, starting from both', () => {
    renderSource();

    const group = screen.getByRole('group', { name: 'Recipient source' });
    expect(group).toHaveAccessibleDescription(
      'Records that match the rules below. Records picked under Data sources are always added.',
    );
    expect(toggle('Both')).toHaveAttribute('aria-pressed', 'true');
    expect(toggle('Contacts')).toHaveAttribute('aria-pressed', 'false');
    expect(toggle('Picked records only')).toBeInTheDocument();
  });

  it('asks how companies turn into addresses only when companies are a source', async () => {
    const probe = renderSource();
    expect(screen.getByRole('radiogroup', { name: 'Company email sources' })).toBeInTheDocument();

    await userEvent.click(toggle('Contacts'));
    expect(probe.values().recipientSource).toBe(AudienceRecipientSource.Contacts);
    expect(screen.queryByRole('radiogroup', { name: 'Company email sources' })).toBeNull();

    await userEvent.click(toggle('Companies'));
    expect(probe.values().recipientSource).toBe(AudienceRecipientSource.Companies);
    await userEvent.click(screen.getByRole('radio', { name: /Company emails only/ }));
    expect(probe.values().companyEmailSource).toBe(AudienceCompanyEmailSource.CompanyEmails);
  });

  it('says the rules are ignored when only picked records are used', async () => {
    renderSource();

    await userEvent.click(toggle('Picked records only'));

    expect(screen.getByRole('group', { name: 'Recipient source' })).toHaveAccessibleDescription(
      'Only the records you pick under Data sources are used; the rules below are ignored.',
    );
    expect(screen.queryByRole('radiogroup', { name: 'Company email sources' })).toBeNull();
  });

  it('keeps a source chosen when its button is pressed again', async () => {
    const probe = renderSource(AudienceRecipientSource.Contacts);

    await userEvent.click(toggle('Contacts'));

    expect(probe.values().recipientSource).toBe(AudienceRecipientSource.Contacts);
    expect(toggle('Contacts')).toHaveAttribute('aria-pressed', 'true');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadImportStatus } from '@exyconn/shell/graphql/generated';
import { ImportReviewDialog } from '../../../../../src/pages/lead-generator/ImportReviewDialog';
import type { LeadImportPreview } from '../../../../../src/pages/lead-generator/leadTypes';
import { renderWithProviders } from '../../../test-utils';
import { preview } from '../lead-fixtures';

const fresh = preview({ placeId: 'new', name: 'New Clinic' });
const same = preview({
  placeId: 'same',
  name: 'Same Dental',
  status: LeadImportStatus.Duplicate,
  existingCompanyId: 'c-same',
  existingName: 'Same Dental Pvt Ltd',
});
const extraA = preview({
  placeId: 'xa',
  name: 'Alpha Dental',
  status: LeadImportStatus.DuplicateWithExtra,
  existingCompanyId: 'c-xa',
  existingName: null,
  extras: [
    { field: 'website', label: 'Website', current: '', incoming: 'https://alpha.example' },
    { field: 'industry', label: 'Industry', current: 'Health', incoming: 'Dentist' },
  ],
});
const extraB = preview({
  placeId: 'xb',
  name: 'Beta Dental',
  status: LeadImportStatus.DuplicateWithExtra,
  existingCompanyId: 'c-xb',
  existingName: 'Beta Dental LLP',
  extras: [
    { field: 'emails', label: 'Email', current: '', incoming: 'hi@beta.example' },
    { field: 'phones', label: 'Phone', current: '', incoming: '+91 20 5555 0102' },
  ],
});

function renderDialog(previews: LeadImportPreview[]) {
  const props = { onConfirm: vi.fn(), onCancel: vi.fn() };
  renderWithProviders(<ImportReviewDialog previews={previews} {...props} />);
  return props;
}

const section = (heading: string) =>
  screen.getByRole('heading', { name: heading }).closest('section') as HTMLElement;

describe('ImportReviewDialog', () => {
  it('groups the businesses into new, plain duplicates and duplicates with extra details', () => {
    renderDialog([fresh, same, extraA, extraB]);

    expect(screen.getByRole('dialog', { name: 'Review before adding to the CRM' })).toBeVisible();
    expect(within(section('New (1) — will be added')).getByText('New Clinic')).toBeInTheDocument();
    expect(
      within(section('Already in the CRM (1) — nothing new, will be skipped')).getByRole('link', {
        name: 'Same Dental Pvt Ltd',
      }),
    ).toHaveAttribute('href', '/companies/c-same');

    const extra = section('Already in the CRM with extra details (2)');
    expect(within(extra).getByRole('link', { name: 'Alpha Dental' })).toHaveAttribute(
      'href',
      '/companies/c-xa',
    );
    expect(
      within(extra).getByText('Website: empty → adds https://alpha.example'),
    ).toBeInTheDocument();
    expect(within(extra).getByText('Industry: Health → adds Dentist')).toBeInTheDocument();
    expect(within(extra).getByText('+ new email hi@beta.example')).toBeInTheDocument();
    expect(within(extra).getByText('+ new phone +91 20 5555 0102')).toBeInTheDocument();
  });

  it('updates every duplicate with extra details unless the person unticks it', async () => {
    const props = renderDialog([fresh, extraA, extraB]);

    const beta = screen.getByRole('checkbox', { name: 'Add the extra details to Beta Dental LLP' });
    expect(beta).toBeChecked();
    await userEvent.click(beta);
    expect(beta).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Add new and update selected' }));

    expect(props.onConfirm).toHaveBeenCalledWith(new Set(['xa']));
  });

  it('re-ticks a duplicate and blocks updating when none is ticked', async () => {
    renderDialog([extraA]);
    const alpha = screen.getByRole('checkbox', { name: 'Add the extra details to Alpha Dental' });
    const update = screen.getByRole('button', { name: 'Add new and update selected' });

    await userEvent.click(alpha);
    expect(update).toBeDisabled();

    await userEvent.click(alpha);
    expect(alpha).toBeChecked();
    expect(update).toBeEnabled();
  });

  it('files only the new businesses on "Add new only"', async () => {
    const props = renderDialog([fresh, extraA]);

    await userEvent.click(screen.getByRole('button', { name: 'Add new only' }));

    expect(props.onConfirm).toHaveBeenCalledWith(new Set());
  });

  it('offers no update without duplicates with extras, and no "new only" without new ones', () => {
    renderDialog([same]);

    expect(screen.getByRole('button', { name: 'Add new only' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Add new and update selected' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /New/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /extra details/ })).not.toBeInTheDocument();
  });

  it('cancels without filing', async () => {
    const props = renderDialog([fresh]);

    expect(screen.queryByRole('heading', { name: /Already in the CRM/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });
});

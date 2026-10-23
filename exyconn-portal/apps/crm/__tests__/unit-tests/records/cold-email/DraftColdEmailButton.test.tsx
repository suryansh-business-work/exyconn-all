import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftColdEmailButton } from '../../../../src/records/cold-email';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

// The form has its own tests; here it only reports a draft written, or a cancel.
vi.mock('../../../../src/records/cold-email/forms/cold-email-draft', () => ({
  ColdEmailDraftForm: ({
    onCreated,
    onCancel,
  }: Readonly<{ onCreated: (id: string) => void; onCancel: () => void }>) => (
    <>
      <button type="button" onClick={() => onCreated('draft-9')}>
        written
      </button>
      <button type="button" onClick={onCancel}>
        give up
      </button>
    </>
  ),
}));

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderButton = (object: 'CONTACT' | 'COMPANY', id: string) =>
  renderWithProviders(
    <>
      <DraftColdEmailButton target={{ object, id, name: 'Acme', emails: [], website: '' }} />
      <Url />
    </>,
    { route: `/${object === 'CONTACT' ? 'contacts' : 'companies'}/${id}/profile` },
  );

// The form's drawer hides the page from assistive tech while it closes, so look past that.
const url = () => screen.getByRole('status', { name: 'url', hidden: true }).textContent;

describe('DraftColdEmailButton', () => {
  it("opens the new draft in place on a company's Cold emails tab", async () => {
    renderButton('COMPANY', 'co-1');
    await userEvent.click(screen.getByRole('button', { name: 'Draft a cold email' }));
    await userEvent.click(await screen.findByRole('button', { name: 'written' }));

    expect(url()).toBe('/companies/co-1/cold-emails?coldEmail=draft-9');
  });

  it("opens the new draft on a contact's Cold emails tab", async () => {
    renderButton('CONTACT', 'c-7');
    await userEvent.click(screen.getByRole('button', { name: 'Draft a cold email' }));
    await userEvent.click(await screen.findByRole('button', { name: 'written' }));

    expect(url()).toBe('/contacts/c-7/cold-emails?coldEmail=draft-9');
  });

  it('stays on the page when the draft is given up', async () => {
    renderButton('CONTACT', 'c-7');
    await userEvent.click(screen.getByRole('button', { name: 'Draft a cold email' }));
    await userEvent.click(await screen.findByRole('button', { name: 'give up' }));

    expect(url()).toBe('/contacts/c-7/profile');
    await vi.waitFor(() => expect(screen.queryByRole('button', { name: 'give up' })).toBeNull());
  });
});

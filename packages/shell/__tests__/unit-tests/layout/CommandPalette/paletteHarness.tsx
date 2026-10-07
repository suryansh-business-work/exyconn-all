import { useState } from 'react';
import { screen, within } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { ROLES } from '@/auth/roles';
import { SearchDocument } from '@/graphql/generated';
import { CommandPalette } from '@/layout/CommandPalette';
import { makeUser, renderWithProviders } from '../../test-utils';
import { answer } from '../../mockResult';

/*
 * The palette as the topbar mounts it, for a finance bundle (each spec mocks `@/config/env`
 * to `finance`, so a finance hit opens in-app).
 */

export const admin = makeUser({ roles: [ROLES.ADMIN] });

/** The server's two invoices for "inv"; one has no subtitle. */
export const invoiceHits = () =>
  answer(
    SearchDocument,
    {
      search: [
        {
          __typename: 'SearchGroup',
          key: 'invoices',
          label: 'Invoices',
          hits: [
            {
              __typename: 'SearchHit',
              id: 'i1',
              title: 'INV-0042',
              subtitle: 'Acme Ltd',
              link: '/finance/invoices/i1',
            },
            {
              __typename: 'SearchHit',
              id: 'i2',
              title: 'INV-0043',
              subtitle: '',
              link: '/finance/invoices/i2',
            },
          ],
        },
      ],
    },
    { query: 'inv' },
  );

export const nothing = (query: string) => answer(SearchDocument, { search: [] }, { query });

function Where() {
  return <output aria-label="location">{useLocation().pathname}</output>;
}

/** The palette with an outside switch, as the topbar holds it. */
function Harness({ onClose }: Readonly<{ onClose: () => void }>) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen((was) => !was)}>
        toggle
      </button>
      <CommandPalette
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      />
      <Where />
    </>
  );
}

export function openPalette(
  mocks = [invoiceHits().mock],
  user: ReturnType<typeof makeUser> | null = admin,
) {
  const onClose = vi.fn();
  renderWithProviders(<Harness onClose={onClose} />, { mocks, user, route: '/finance' });
  return { onClose, field: screen.getByRole('textbox', { name: 'Search the portal' }) };
}

/** Debounce plus the server's answer, with room for a loaded CI runner. */
export const SERVER = { timeout: 5000 };

export const rows = () => within(screen.getByRole('dialog')).queryAllByRole('button');

/** The page behind the dialog is aria-hidden while it is open, so look past that. */
export const whereNow = () => screen.getByRole('status', { name: 'location', hidden: true });

import { describe, expect, it } from 'vitest';
import { ROLES } from '@/auth/roles';
import { MODULES } from '@/config/modules';
import { groupItems, moduleItems, recordItems } from '@/layout/CommandPalette/palette.items';
import type { SearchQuery } from '@/graphql/generated';

const first = MODULES[0];

describe('what the palette offers', () => {
  it('matches modules on any part of their name', () => {
    const items = moduleItems([ROLES.ADMIN], first.label.slice(1, 4));

    expect(items.some((item) => item.title === first.label)).toBe(true);
  });

  it('offers nothing until something is typed', () => {
    expect(moduleItems([ROLES.ADMIN], '   ')).toEqual([]);
  });

  it('never offers a module the roles cannot open', () => {
    const employeeOnly = moduleItems([ROLES.EMPLOYEE], '');
    const titles = moduleItems([ROLES.EMPLOYEE], 'a').map((item) => item.title);

    expect(employeeOnly).toEqual([]);
    expect(titles).not.toContain('Admin');
  });

  it('works out which app a record opens in from its own path', () => {
    const data = {
      search: [
        {
          key: 'invoices',
          label: 'Invoices',
          hits: [
            { id: 'i1', title: 'INV-0042', subtitle: 'Acme Ltd · SENT', link: '/finance/invoices' },
          ],
        },
        {
          key: 'tickets',
          label: 'Support tickets',
          hits: [
            {
              id: 't1',
              title: 'EXY-1 · Cannot sign in',
              subtitle: 'OPEN',
              link: '/support/tickets/t1',
            },
          ],
        },
      ],
    } as unknown as SearchQuery;

    const items = recordItems(data);

    expect(items.map((item) => item.app)).toEqual(['finance', 'support']);
    expect(items[0].group).toBe('Invoices');
  });

  it('drops a hit whose path no app claims, rather than guessing', () => {
    const data = {
      search: [
        {
          key: 'odd',
          label: 'Odd',
          hits: [{ id: 'x', title: 'x', subtitle: '', link: '/nowhere' }],
        },
      ],
    } as unknown as SearchQuery;

    expect(recordItems(data)).toEqual([]);
  });

  it('groups in the order the items arrived', () => {
    const items = [
      { id: '1', title: 'a', subtitle: '', group: 'Modules', app: 'hub' as const, path: '/' },
      { id: '2', title: 'b', subtitle: '', group: 'Invoices', app: 'hub' as const, path: '/' },
      { id: '3', title: 'c', subtitle: '', group: 'Modules', app: 'hub' as const, path: '/' },
    ];

    const groups = groupItems(items);

    expect(groups.map((group) => group.label)).toEqual(['Modules', 'Invoices']);
    expect(groups[0].items).toHaveLength(2);
  });
});

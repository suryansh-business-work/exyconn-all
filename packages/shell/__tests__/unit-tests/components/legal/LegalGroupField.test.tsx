import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegalItemKind, ListLegalGroupsDocument } from '@/graphql/generated';
import { LegalGroupField } from '@/components/legal';
import { renderWithProviders } from '../../test-utils';
import { answer } from '../../mockResult';
import { FormHarness } from '../form/formHarness';
import { group } from './legalFixtures';

const groups = answer(ListLegalGroupsDocument, {
  listLegalGroups: [
    group('g1', 'Part Time Employee Contracts', LegalItemKind.Contract),
    group('g2', 'IT policies', LegalItemKind.Policy),
  ],
});

describe('LegalGroupField', () => {
  it('offers "No group" and only the groups of its own kind', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ groupId: '' }}>
        <LegalGroupField kind={LegalItemKind.Contract} />
      </FormHarness>,
      { mocks: [groups.mock] },
    );
    await userEvent.click(await screen.findByRole('combobox', { name: 'Group' }));
    const list = await screen.findByRole('listbox');

    expect(
      await within(list).findByRole('option', { name: 'Part Time Employee Contracts' }),
    ).toBeInTheDocument();
    expect(within(list).getByRole('option', { name: 'No group' })).toBeInTheDocument();
    expect(within(list).queryByRole('option', { name: 'IT policies' })).not.toBeInTheDocument();
  });
});

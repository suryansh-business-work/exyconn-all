import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { CrmOp } from '@exyconn/shell/graphql/generated';
import { OperatorSelect } from '../../../../../src/records/filters/filter-builder/fields/OperatorSelect';
import type { FilterBuilderValues } from '../../../../../src/records/filters/filter-builder';
import { renderWithProviders } from '../../../test-utils';

function ValuesProbe() {
  const values = useWatch<FilterBuilderValues>({ name: 'groups.0.conditions.0.values' });
  return <output>{JSON.stringify(values)}</output>;
}

function Harness() {
  const form = useForm<FilterBuilderValues>({
    defaultValues: { groups: [{ conditions: [{ property: 'name', op: '', values: ['kept?'] }] }] },
  });
  return (
    <FormProvider {...form}>
      <OperatorSelect path="groups.0.conditions.0" ops={[CrmOp.Contains, CrmOp.Eq]} />
      <ValuesProbe />
    </FormProvider>
  );
}

describe('OperatorSelect', () => {
  it('offers only the allowed operators and starts one blank value from no operator', async () => {
    renderWithProviders(<Harness />);
    await userEvent.click(screen.getByRole('combobox', { name: 'Operator' }));
    const list = screen.getByRole('listbox');
    expect(
      within(list)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['contains', 'is']);
    await userEvent.click(within(list).getByRole('option', { name: 'is' }));
    expect(screen.getByRole('status')).toHaveTextContent('[""]');
  });
});

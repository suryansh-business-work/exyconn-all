import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { TaxRegimeChoicesDocument } from '@/graphql/generated';
import { COMPANY_TAX_REGIME, NO_TAX_BRACKET, TaxRegimeField } from '@/components/pay';
import { renderWithProviders } from '../../test-utils';
import { FormHarness } from '../form/formHarness';

const choicesMock: MockLink.MockedResponse = {
  request: { query: TaxRegimeChoicesDocument },
  result: {
    data: {
      taxRegimeChoices: [
        { __typename: 'TaxRegimeChoice', regimeKey: 'NEW', name: 'New regime', active: true },
        { __typename: 'TaxRegimeChoice', regimeKey: 'OLD', name: 'Old regime', active: false },
      ],
    },
  },
  maxUsageCount: 5,
};

const failedMock: MockLink.MockedResponse = {
  request: { query: TaxRegimeChoicesDocument },
  error: new Error('network down'),
};

function renderField(taxRegime: string, mocks: MockLink.MockedResponse[]) {
  return renderWithProviders(
    <FormHarness defaultValues={{ taxRegime }}>
      <TaxRegimeField />
    </FormHarness>,
    { mocks },
  );
}

async function openOptions(): Promise<string[]> {
  await userEvent.click(screen.getByRole('combobox'));
  const listbox = await screen.findByRole('listbox');
  return within(listbox)
    .getAllByRole('option')
    .map((option) => option.textContent ?? '');
}

describe('TaxRegimeField', () => {
  it('offers the default, each regime on file (flagging inactive ones) and no tax bracket', async () => {
    renderField('NEW', [choicesMock]);

    expect(
      await screen.findByText("This regime's slabs set the TDS, whenever payroll withholds TDS."),
    ).toBeInTheDocument();
    await screen.findByRole('combobox', { name: /Tax regime/ });
    await expect.poll(async () => screen.getByRole('combobox').textContent).toBe('New regime');
    expect(await openOptions()).toEqual([
      'Company default',
      'New regime',
      'Old regime (not applied)',
      'No tax bracket',
    ]);
  });

  it('keeps a deleted regime selectable under its key once the list has arrived', async () => {
    renderField('LEGACY', [choicesMock]);

    await expect
      .poll(() => screen.getByRole('combobox').textContent)
      .toBe('LEGACY (no longer on file)');
    expect(await openOptions()).toContain('LEGACY (no longer on file)');
  });

  it('explains the company default', async () => {
    renderField(COMPANY_TAX_REGIME, [choicesMock]);

    expect(
      await screen.findByText(
        'Taxed under the regime Payroll Settings names, whenever payroll withholds TDS.',
      ),
    ).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('combobox').textContent).toBe('Company default');
  });

  it('explains no tax bracket', async () => {
    renderField(NO_TAX_BRACKET, [choicesMock]);

    expect(
      await screen.findByText('No tax bracket: payroll withholds no TDS from this employee.'),
    ).toBeInTheDocument();
  });

  it('says the regimes failed to load, without inventing a missing one', async () => {
    renderField('NEW', [failedMock]);

    expect(
      await screen.findByText(
        "The regimes couldn't be loaded. Company default and No tax bracket still work.",
      ),
    ).toBeInTheDocument();
    expect(await openOptions()).toEqual(['Company default', 'No tax bracket']);
  });
});

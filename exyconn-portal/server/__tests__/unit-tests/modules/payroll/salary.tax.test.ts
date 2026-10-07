import {
  checkTaxChoiceIn,
  checkedTaxChoice,
  taxRegimeChoices,
} from '../../../../src/modules/payroll/salary.tax';
import { TaxRegimeModel } from '../../../../src/modules/payroll/tax-slab.model';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization({ currency: 'INR', locale: 'en-IN', taxSystem: 'INDIA_GST' });

const regime = (regimeKey: string, financialYear: string, name: string, active = true) =>
  TaxRegimeModel.create({ regimeKey, financialYear, name, active });

describe('taxRegimeChoices', () => {
  it('offers each regime key once, named after its latest financial year', async () => {
    await regime('NEW', '2025-26', 'New regime 25');
    await regime('NEW', '2026-27', 'New regime 26');
    await regime('OLD', '2025-26', 'Old regime', false);

    const choices = await taxRegimeChoices();

    expect(choices).toHaveLength(2);
    expect(choices).toEqual(
      expect.arrayContaining([
        { regimeKey: 'NEW', name: 'New regime 26', active: true },
        { regimeKey: 'OLD', name: 'Old regime', active: false },
      ]),
    );
  });

  it('offers nothing while the tax table is empty', async () => {
    await expect(taxRegimeChoices()).resolves.toEqual([]);
  });
});

describe('checkedTaxChoice', () => {
  it('clears the regime of an employee put in no tax bracket, without a lookup', async () => {
    await expect(
      checkedTaxChoice({ basic: 1, taxExempt: true, taxRegimeKey: 'MISSING' }),
    ).resolves.toEqual({ basic: 1, taxExempt: true, taxRegimeKey: null });
  });

  it('leaves a choice the caller did not send untouched', async () => {
    const input = { basic: 1, taxExempt: false };
    await expect(checkedTaxChoice(input)).resolves.toBe(input);
  });

  it('stores a blank or null regime as the company default', async () => {
    await expect(checkedTaxChoice({ taxRegimeKey: '   ' })).resolves.toEqual({
      taxRegimeKey: null,
    });
    await expect(checkedTaxChoice({ taxRegimeKey: null })).resolves.toEqual({
      taxRegimeKey: null,
    });
  });

  it('keeps a regime on file, trimmed', async () => {
    await regime('OLD', '2026-27', 'Old regime');
    await expect(checkedTaxChoice({ taxRegimeKey: ' OLD ' })).resolves.toEqual({
      taxRegimeKey: 'OLD',
    });
  });

  it('refuses a regime that is not in the tax table', async () => {
    await expect(checkedTaxChoice({ taxRegimeKey: 'GHOST' })).rejects.toThrow(
      'There is no tax regime "GHOST" on file. Add it in HR › Tax Slabs first.',
    );
  });
});

describe('checkTaxChoiceIn', () => {
  const ctx = {
    user: { id: 'hr', email: 'hr@exyconn.com', roles: ['HR'] },
  } as unknown as GraphQLContext;

  type Mutation = (parent: unknown, args: never, context: GraphQLContext) => Promise<unknown>;

  function wrapped() {
    const create = jest.fn(async (_p: unknown, args: unknown) => args);
    const update = jest.fn(async (_p: unknown, args: unknown) => args);
    const remove = jest.fn(async () => true);
    const mutations = checkTaxChoiceIn<Record<string, Mutation>>(
      { createThing: create, updateThing: update, deleteThing: remove },
      'Thing',
    );
    return { mutations, create, update, remove };
  }

  it('checks the tax choice of a create and an update before the write runs', async () => {
    await regime('OLD', '2026-27', 'Old regime');
    const { mutations, create, update } = wrapped();

    await mutations.createThing(null, { input: { taxRegimeKey: ' OLD ' } } as never, ctx);
    await mutations.updateThing(null, { id: 'x1', input: { taxExempt: true } } as never, ctx);

    expect(create).toHaveBeenCalledWith(null, { input: { taxRegimeKey: 'OLD' } }, ctx);
    expect(update).toHaveBeenCalledWith(
      null,
      { id: 'x1', input: { taxExempt: true, taxRegimeKey: null } },
      ctx,
    );
  });

  it('never reaches the write with a regime that is not on file', async () => {
    const { mutations, create } = wrapped();
    await expect(
      mutations.createThing(null, { input: { taxRegimeKey: 'GHOST' } } as never, ctx),
    ).rejects.toThrow(/no tax regime "GHOST"/);
    expect(create).not.toHaveBeenCalled();
  });

  it('passes every other mutation through as it was', () => {
    const { mutations, remove } = wrapped();
    expect(mutations.deleteThing).toBe(remove);
  });
});

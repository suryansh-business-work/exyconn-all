import { describe, expect, it } from 'vitest';
import {
  calculateEstimate,
  createEstimate,
  duplicateEstimate,
  duplicateScenario,
  estimateSchema,
  LIMITS,
  newId,
  parseEstimateFile,
  previewImport,
  toExportFile,
  type CalculatorPreset,
} from '../../src';
import { estimate, line, NOW, role, scenario, usd, usage } from './fixtures';

const exported = (value = estimate()) => JSON.stringify(toExportFile(value, NOW));

describe('JSON import', () => {
  it('round-trips an estimate and recomputes the same totals', () => {
    const original = estimate({
      reportingCurrency: 'USD',
      fxRates: [usd],
      scenarios: [
        scenario({ roles: [role()], lines: [line()], ai: { ...scenario().ai, usage: [usage()] } }),
      ],
    });
    const result = parseEstimateFile(exported(original));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.estimate).toEqual(original);
      expect(calculateEstimate(result.file.estimate)[0].summary).toEqual(
        calculateEstimate(original)[0].summary,
      );
    }
  });

  it('rejects malformed JSON, foreign files and unsupported versions with an explanation', () => {
    expect(parseEstimateFile('{nope')).toMatchObject({ ok: false, reason: 'syntax' });
    expect(parseEstimateFile('[]')).toMatchObject({ ok: false, reason: 'format' });
    expect(parseEstimateFile('{"format":"other"}')).toMatchObject({ ok: false, reason: 'format' });
    const future = parseEstimateFile(
      JSON.stringify({ format: 'exyconn.gcc-estimate', schemaVersion: 2 }),
    );
    expect(future).toMatchObject({ ok: false, reason: 'version' });
    expect(future.ok === false && future.message).toContain('version 2');
  });

  it('refuses prototype-polluting keys anywhere in the document', () => {
    const polluted = exported().replace('"company":{', '"company":{"__proto__":{"admin":true},');
    expect(parseEstimateFile(polluted)).toMatchObject({ ok: false, reason: 'syntax' });
    expect(({} as Record<string, unknown>).admin).toBeUndefined();
  });

  it('rejects unknown fields, bad ids, unsafe values and imported totals', () => {
    const withTotals = JSON.parse(exported());
    withTotals.estimate.total = 1;
    const result = parseEstimateFile(JSON.stringify(withTotals));
    expect(result).toMatchObject({ ok: false, reason: 'invalid' });
    const badId = exported(estimate({ id: 'Bad ID!' as string }));
    expect(parseEstimateFile(badId)).toMatchObject({ ok: false, reason: 'invalid' });
    const formula = JSON.parse(exported(estimate({ scenarios: [scenario({ lines: [line()] })] })));
    formula.estimate.scenarios[0].lines[0].unitPrice = '=1+1';
    const invalid = parseEstimateFile(JSON.stringify(formula));
    expect(invalid.ok === false && invalid.reason === 'invalid' && invalid.issues[0]).toContain(
      'unitPrice',
    );
  });

  it('names a root-level problem as (root)', () => {
    const extra = JSON.parse(exported());
    extra.extra = true;
    const result = parseEstimateFile(JSON.stringify(extra));
    expect(result.ok === false && result.reason === 'invalid' && result.issues[0]).toMatch(
      /^\(root\): /,
    );
  });

  it('rejects oversized payloads and excessive item counts', () => {
    expect(parseEstimateFile(' '.repeat(LIMITS.payloadBytes + 1))).toMatchObject({
      ok: false,
      reason: 'too-large',
    });
    const lines = Array.from({ length: LIMITS.lines + 1 }, (_, index) =>
      line({ id: `line-${index}` }),
    );
    expect(estimateSchema.safeParse(estimate({ scenarios: [scenario({ lines })] })).success).toBe(
      false,
    );
  });

  it('enforces cross-field rules', () => {
    const check = (value: unknown) => estimateSchema.safeParse(value).success;
    expect(check(estimate({ activeScenarioId: 'missing' }))).toBe(false);
    expect(check(estimate({ scenarios: [scenario(), scenario()] }))).toBe(false);
    expect(check(estimate({ fxRates: [usd, usd] }))).toBe(false);
    expect(check(estimate({ reportingCurrency: 'GBP' }))).toBe(false);
    expect(
      check(estimate({ scenarios: [scenario({ lines: [line({ startMonth: 5, endMonth: 2 })] })] })),
    ).toBe(false);
    const cached = usage({ cachedInputMTokMonthly: 20 });
    expect(
      check(estimate({ scenarios: [scenario({ ai: { ...scenario().ai, usage: [cached] } })] })),
    ).toBe(false);
  });

  it('previews what an import contains', () => {
    const preview = previewImport(
      estimate({ scenarios: [scenario({ roles: [role()], lines: [line()] })] }),
    );
    expect(preview).toEqual({
      name: 'Test estimate',
      updatedAt: NOW,
      reportingCurrency: 'INR',
      scenarioCount: 1,
      itemCount: 2,
    });
  });
});

describe('estimate factory', () => {
  const preset: CalculatorPreset = {
    reportingCurrency: 'INR',
    currencies: ['INR'],
    fxRates: [],
    scenarios: [scenario({ id: 'lean', name: 'Lean' })],
    pricing: [],
    cities: [],
    departments: [],
  };

  it('creates a valid estimate that does not share objects with the preset', () => {
    const created = createEstimate(preset, 'My GCC', NOW);
    expect(estimateSchema.safeParse(created).success).toBe(true);
    expect(created.activeScenarioId).toBe('lean');
    created.scenarios[0].name = 'Changed';
    expect(preset.scenarios[0].name).toBe('Lean');
  });

  it('duplicates scenarios and estimates under new ids', () => {
    const copy = duplicateScenario(scenario(), 'Copy');
    expect(copy.id).not.toBe('standard');
    expect(copy.name).toBe('Copy');
    const original = estimate();
    const twin = duplicateEstimate(original, 'Twin', '2026-10-15T00:00:00.000Z');
    expect(twin).toMatchObject({ name: 'Twin', createdAt: '2026-10-15T00:00:00.000Z' });
    expect(twin.id).not.toBe(original.id);
    expect(newId('x')).toMatch(/^x-[0-9a-f]{12}$/);
  });
});

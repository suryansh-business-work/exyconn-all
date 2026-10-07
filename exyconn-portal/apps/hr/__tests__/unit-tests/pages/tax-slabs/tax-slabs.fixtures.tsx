import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import type { TaxRegimeRow } from '../../../../src/pages/tax-slabs/forms/tax-regime';

/** Two regimes on file: last year's, retired, and this year's, applied. */
export const REGIMES: TaxRegimeRow[] = [
  {
    id: 'regime-old',
    regimeKey: 'OLD',
    financialYear: '2025-26',
    name: 'Old regime',
    standardDeduction: 50000,
    rebateIncomeLimit: 500000,
    rebateMaxTax: 12500,
    cessPercent: 4,
    active: false,
  },
  {
    id: 'regime-new',
    regimeKey: 'NEW',
    financialYear: '2026-27',
    name: 'New regime',
    standardDeduction: 75000,
    rebateIncomeLimit: 1200000,
    rebateMaxTax: 60000,
    cessPercent: 4,
    active: true,
  },
];

export interface SlabFormProps {
  initial: unknown;
  regimeOptions: SelectOption[];
  defaultRegimeKey: string;
  defaultFinancialYear: string;
  onCancel: () => void;
  onDone: () => void;
}

export interface PanelProps {
  regimes: readonly TaxRegimeRow[];
  loading: boolean;
  refetch: () => Promise<unknown>;
}

/** The props the stand-ins last rendered with. */
export const captured: { slabForm: SlabFormProps | null; panel: PanelProps | null } = {
  slabForm: null,
  panel: null,
};

/** Stands in for TaxSlabForm (tested on its own): records its props, exposes its callbacks. */
export function SlabFormStub(props: Readonly<SlabFormProps>) {
  captured.slabForm = props;
  return (
    <div>
      <p>Band form</p>
      <button type="button" onClick={props.onCancel}>
        Cancel band
      </button>
      <button type="button" onClick={props.onDone}>
        Save band
      </button>
    </div>
  );
}

/** Stands in for TaxRegimePanel (tested on its own): records its props, exposes its reload. */
export function RegimePanelStub(props: Readonly<PanelProps>) {
  captured.panel = props;
  return (
    <button type="button" onClick={props.refetch}>
      Reload regimes
    </button>
  );
}

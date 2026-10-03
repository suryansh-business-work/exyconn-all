import { useMemo, useState } from 'react';
import { isReady, totalsOf, type Candidate } from './runPlan';

/**
 * Which READY employees the run is for. Every one of them starts picked, so the common case
 * — run the month for everybody who can be run — is one click; HR unticks the exceptions.
 */
export function useCandidateSelection(employees: readonly Candidate[]) {
  const ready = useMemo(() => employees.filter(isReady), [employees]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(ready.map((c) => c.employeeId)),
  );

  const picked = useMemo(() => ready.filter((c) => selected.has(c.employeeId)), [ready, selected]);

  const toggle = (employeeId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const allPicked = ready.length > 0 && picked.length === ready.length;
  const toggleAll = () => {
    setSelected(allPicked ? new Set() : new Set(ready.map((c) => c.employeeId)));
  };

  return {
    picked,
    totals: totalsOf(picked),
    isPicked: (employeeId: string) => selected.has(employeeId),
    toggle,
    toggleAll,
    allPicked,
    somePicked: picked.length > 0 && !allPicked,
    readyCount: ready.length,
  };
}

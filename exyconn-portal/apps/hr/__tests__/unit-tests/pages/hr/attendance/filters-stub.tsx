import type { AttendanceFilterState } from '../../../../../src/pages/hr/attendance/attendance.filters';

interface FiltersStubProps {
  value: AttendanceFilterState;
  onChange: (next: AttendanceFilterState) => void;
}

/**
 * Stands in for the attendance toolbar inside the page test: shows the status it was handed
 * and narrows to WFH on request. The toolbar has its own tests.
 */
export function AttendanceFiltersStub({ value, onChange }: Readonly<FiltersStubProps>) {
  return (
    <div>
      <p>{`Status filter: ${value.status || 'any'}`}</p>
      <button type="button" onClick={() => onChange({ ...value, status: 'WFH' })}>
        Only WFH
      </button>
    </div>
  );
}

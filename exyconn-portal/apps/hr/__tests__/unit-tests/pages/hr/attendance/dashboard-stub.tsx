import type { ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import type { DocumentNode } from 'graphql';
import type { TableFilterInput } from '@exyconn/shell/graphql/generated';
import type { AttendanceGridContext } from '../../../../../src/pages/hr/attendance/attendance-grid';

/** The CrudDashboard props the attendance register hands over (it has no create/edit form). */
export interface AttendanceDashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  exportFileName: string;
  searchPlaceholder: string;
  stats: unknown[];
  refreshSignal: number;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: AttendanceGridContext;
  onRowClick: (row: never) => void;
  toolbar: ReactNode;
  extraDialogs: ReactNode;
}

/** The last props the stand-in rendered with. */
export const attendanceDashboard: { props: AttendanceDashboardProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never rendered the dashboard. */
export function attendanceProps(): AttendanceDashboardProps {
  if (!attendanceDashboard.props) {
    throw new Error('CrudDashboard was not rendered');
  }
  return attendanceDashboard.props;
}

/**
 * Stands in for `@exyconn/crud`'s CrudDashboard (ag-grid does not lay out under jsdom): records
 * its props and renders the page's own toolbar and dialogs, as the real one does.
 */
export function AttendanceDashboardStub(props: Readonly<AttendanceDashboardProps>) {
  attendanceDashboard.props = props;
  return (
    <div>
      <h1>{props.title}</h1>
      {props.toolbar}
      {props.extraDialogs}
    </div>
  );
}

/** What the page handed to usePagedFetcher. */
export const attendancePaged: {
  document: DocumentNode | null;
  select: ((data: never) => unknown) | null;
  extraFilters: readonly TableFilterInput[] | undefined;
} = { document: null, select: null, extraFilters: undefined };

/** Stands in for usePagedFetcher: records the document, page picker and extra filters. */
export function useAttendancePagedStub(
  document: DocumentNode,
  select: (data: never) => unknown,
  extraFilters?: readonly TableFilterInput[],
) {
  attendancePaged.document = document;
  attendancePaged.select = select;
  attendancePaged.extraFilters = extraFilters;
  return () => Promise.resolve({ rows: [], totalCount: 0 });
}

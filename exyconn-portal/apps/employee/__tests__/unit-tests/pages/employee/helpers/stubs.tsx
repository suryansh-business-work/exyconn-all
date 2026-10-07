/**
 * Stand-ins for the pieces a page composes but does not own: the RHF forms (tested in their
 * own unit), and shell widgets that run their own queries. Each one exposes the props the
 * page hands it, and buttons for the callbacks, so the page's wiring is what gets tested.
 */

interface FormStubProps {
  onCancel?: () => void;
  onDone: () => unknown;
  ticketId?: string;
  projects?: ReadonlyArray<{ id: string; name: string }>;
}

export function FormStub({ onCancel, onDone, ticketId, projects }: Readonly<FormStubProps>) {
  // A promise onDone returns is left to reject loudly: an unhandled rejection fails the run.
  const done = () => {
    onDone();
  };
  return (
    <div
      data-testid="form-stub"
      data-ticket={ticketId}
      data-projects={projects?.map((project) => project.name).join(',')}
    >
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Stub cancel
        </button>
      )}
      <button type="button" onClick={done}>
        Stub done
      </button>
    </div>
  );
}

export function WorkArrangementStub() {
  return <p>Work arrangement card</p>;
}

interface AttendanceCalendarStubProps {
  attendance: readonly unknown[];
  attendanceLoading: boolean;
}

export function AttendanceCalendarStub({
  attendance,
  attendanceLoading,
}: Readonly<AttendanceCalendarStubProps>) {
  const state = attendanceLoading ? 'loading' : 'ready';
  return <p>{`Calendar of ${attendance.length} days, ${state}`}</p>;
}

interface TrackerViewStubProps {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  loading: boolean;
  days: readonly unknown[];
  buckets: readonly unknown[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
  day?: unknown;
  dayLoading: boolean;
  dayLabel: string;
  timezone: string;
}

/** Shows what MyTrackerPage hands the shell's TrackerView, and drives its callbacks. */
export function TrackerViewStub(props: Readonly<TrackerViewStubProps>) {
  const facts = [
    `month ${props.monthLabel}`,
    `${props.buckets.length} buckets`,
    `selected ${props.selectedDate ?? 'none'}`,
    `label ${props.dayLabel || 'none'}`,
    `zone ${props.timezone}`,
    props.loading ? 'calendar loading' : 'calendar ready',
    props.dayLoading ? 'day loading' : 'day ready',
    props.day ? 'day loaded' : 'no day',
  ];
  return (
    <section aria-label="Tracker view">
      <p>{facts.join(' | ')}</p>
      <p>{`${props.days.length} day cells`}</p>
      <button type="button" onClick={props.onPrev}>
        Stub previous
      </button>
      <button type="button" onClick={props.onNext}>
        Stub next
      </button>
      <button type="button" onClick={() => props.onSelectDay('2026-03-10')}>
        Stub pick day
      </button>
    </section>
  );
}

interface OffComputerStubProps {
  from: string;
  to: string;
  projects: ReadonlyArray<{ id: string; name: string }>;
}

export function OffComputerStub({ from, to, projects }: Readonly<OffComputerStubProps>) {
  const names = projects.map((project) => project.name).join(',') || 'no projects';
  return <p>{`Off-computer ${from} to ${to} for ${names}`}</p>;
}

interface SupportThreadStubProps {
  ticketId: string;
  description: string;
  attachments: readonly { name: string }[];
  onClose: () => void;
}

export function SupportThreadStub({
  ticketId,
  description,
  attachments,
  onClose,
}: Readonly<SupportThreadStubProps>) {
  return (
    <div>
      <p>{`Thread ${ticketId}: ${description} (${attachments.length} files)`}</p>
      <button type="button" onClick={onClose}>
        Stub close thread
      </button>
    </div>
  );
}

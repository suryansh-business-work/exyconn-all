import { useMemo } from 'react';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import type { MaMeetingDetailFragment } from '@exyconn/shell/graphql/generated';
import { ActionChecklist } from '../actions/ActionChecklist';
import type { MeetingScope } from '../lib/scope';
import { OverviewTab } from './overview/OverviewTab';
import { TranscriptTab } from './transcript/TranscriptTab';
import { ParticipantsTab } from './participants/ParticipantsTab';
import { SummaryTab } from './summary/SummaryTab';
import { DecisionsTab } from './decisions/DecisionsTab';
import { EmailTab } from './email/EmailTab';
import { RecordingTab } from './recording/RecordingTab';
import { MeetingEvents } from '../events/MeetingEvents';

interface MeetingTabsProps {
  meeting: MaMeetingDetailFragment;
  scope: MeetingScope;
  /** The meetings list; this meeting's tabs live under `<listPath>/<id>`. */
  listPath: string;
}

/** The meeting's tabs, the active one a slug in the URL. */
export function MeetingTabs({ meeting, scope, listPath }: Readonly<MeetingTabsProps>) {
  const items = useMemo<TabberItem[]>(
    () => [
      {
        slug: 'overview',
        label: 'Overview',
        content: <OverviewTab meeting={meeting} listPath={listPath} />,
      },
      { slug: 'transcript', label: 'Transcript', content: <TranscriptTab meeting={meeting} /> },
      {
        slug: 'participants',
        label: 'Participants',
        content: <ParticipantsTab meetingId={meeting.id} />,
      },
      { slug: 'summary', label: 'AI Notes', content: <SummaryTab meeting={meeting} /> },
      {
        slug: 'action-items',
        label: 'Action Items',
        content: <ActionChecklist scope={scope} meetingId={meeting.id} />,
      },
      { slug: 'decisions', label: 'Decisions', content: <DecisionsTab meetingId={meeting.id} /> },
      { slug: 'email', label: 'Email', content: <EmailTab meeting={meeting} /> },
      { slug: 'recording', label: 'Recording', content: <RecordingTab meetingId={meeting.id} /> },
      {
        slug: 'activity',
        label: 'Activity',
        content: (
          <MeetingEvents
            scope={scope}
            meetingId={meeting.id}
            meetingHref={(id) => `${listPath}/${id}`}
          />
        ),
      },
    ],
    [meeting, scope, listPath],
  );
  return (
    <Tabber basePath={`${listPath}/${meeting.id}`} items={items} ariaLabel="Meeting sections" />
  );
}

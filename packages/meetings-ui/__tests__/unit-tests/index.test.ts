import { describe, expect, it } from 'vitest';
import * as meetingsUi from '../../src';

describe('@exyconn/meetings-ui', () => {
  it('exports every screen the two apps mount', () => {
    const byName = (a: string, b: string) => a.localeCompare(b);
    expect(Object.keys(meetingsUi).sort(byName)).toEqual(
      [
        'ActionChecklist',
        'ActionChecklistPage',
        'ConnectExtensionPage',
        'ExtensionPage',
        'LogsPage',
        'MeetingCalendarPage',
        'MeetingDashboardPage',
        'MeetingDetailPage',
        'MeetingSettingsPage',
        'MeetingsListPage',
        'ParticipantsPage',
        'ReleaseDetailsPage',
        'ReleasesPage',
        'TranscriptsPage',
        'meetingPaths',
      ].sort(byName),
    );
  });
});

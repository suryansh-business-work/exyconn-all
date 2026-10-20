import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import type { MeetingPageProps } from '../lib/scope';
import { ActionChecklist } from './ActionChecklist';

/** Meeting Assistant → Action checklist: every action from every meeting in scope. */
export function ActionChecklistPage({ scope }: Readonly<MeetingPageProps>) {
  return (
    <>
      <PageHeader
        title={scope === 'ALL' ? 'Action Checklist' : 'My action items'}
        subtitle="Actions agreed in meetings — AI suggestions stay flagged until someone confirms them"
      />
      <ActionChecklist scope={scope} />
    </>
  );
}

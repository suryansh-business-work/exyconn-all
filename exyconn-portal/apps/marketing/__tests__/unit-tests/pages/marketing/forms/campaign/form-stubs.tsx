import { Button } from '@exyconn/shell/components/ui';
import type { PreviewRecord } from '../../../../../../src/pages/marketing/forms/campaign/personalize/PreviewAsField';

/**
 * Stand-ins for the forms other screens own (schedule, test send, save as template) and the
 * delivery panel: each shows the props the studio handed it and fires its callbacks on a
 * button, so a step's test checks only the wiring. Each form has its own tests.
 */
export function CampaignScheduleForm({
  campaignId,
  audienceListId,
  eligible,
  canSend,
  beforeQueue,
  onQueued,
}: Readonly<{
  campaignId: string;
  audienceListId: string;
  eligible: number;
  canSend: boolean;
  beforeQueue: () => Promise<unknown>;
  onQueued: () => void;
}>) {
  return (
    <section aria-label="Schedule form">
      {JSON.stringify({ campaignId, audienceListId, eligible, canSend })}
      <Button onClick={() => beforeQueue().then(onQueued)}>Queue send</Button>
    </section>
  );
}

export function CampaignTestForm({
  campaignId,
  record,
  beforeSend,
}: Readonly<{
  campaignId: string;
  record: PreviewRecord | null;
  beforeSend: () => Promise<unknown>;
}>) {
  return (
    <section aria-label="Test form">
      {JSON.stringify({ campaignId, record: record?.id ?? null })}
      <Button onClick={() => beforeSend()}>Send test</Button>
    </section>
  );
}

export function CampaignTemplateForm({
  content,
  onDone,
  onCancel,
}: Readonly<{ content: unknown; onDone: () => void; onCancel: () => void }>) {
  return (
    <section aria-label="Template form">
      {JSON.stringify(content)}
      <Button onClick={onDone}>Template saved</Button>
      <Button onClick={onCancel}>Template cancelled</Button>
    </section>
  );
}

export function CampaignDeliveryPanel({
  campaignId,
  onChanged,
}: Readonly<{ campaignId: string; onChanged?: () => void }>) {
  return (
    <section aria-label="Delivery panel">
      {campaignId}
      <Button onClick={onChanged}>Delivery changed</Button>
    </section>
  );
}

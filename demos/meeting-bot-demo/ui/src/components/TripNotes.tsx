import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Stack, Text, Typography } from '@exyconn/shell/components/ui';
import type { DemoTrip } from '../pages/meeting-bot/useMeetingBotDemo';

type Summary = NonNullable<DemoTrip['summary']>;
type Action = Summary['actionItems'][number];

/** One bulleted section of the notes, or nothing when it is empty. */
function NoteList({ title, items }: Readonly<{ title: string; items: readonly string[] }>) {
  const t = useT();
  if (items.length === 0) {
    return null;
  }
  return (
    <div>
      <Typography variant="subtitle2" component="h4">
        {t(title)}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 3 }}>
        {items.map((item) => (
          <li key={item}>
            <Text>{item}</Text>
          </li>
        ))}
      </Box>
    </div>
  );
}

/** "Send quote — Asha, due 6 Nov 2026": who owns an action and by when, as far as was said. */
function useActionLine() {
  const t = useT();
  const { formatDate } = useFormatters();
  return (item: Action) => {
    const owner = item.assignedTo ?? t('No owner yet');
    const due = item.dueDate ? formatDate(item.dueDate) : item.dueText;
    const parts = due ? [owner, due] : [owner];
    return `${item.title} — ${parts.join(', ')}`;
  };
}

/** The meeting's notes: summary, discussion, decisions and action items. */
export function TripNotes({ summary }: Readonly<{ summary: Summary }>) {
  const t = useT();
  const actionLine = useActionLine();
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" component="h3">
        {summary.title}
      </Typography>
      {summary.executiveSummary && <Text>{summary.executiveSummary}</Text>}
      <NoteList title="What was discussed" items={summary.discussionPoints} />
      <NoteList title="Decisions" items={summary.decisions} />
      <NoteList title="Action items" items={summary.actionItems.map(actionLine)} />
      {summary.actionItems.length === 0 && summary.decisions.length === 0 && (
        <Text color="text.secondary">{t('No decisions or action items were recorded.')}</Text>
      )}
    </Stack>
  );
}

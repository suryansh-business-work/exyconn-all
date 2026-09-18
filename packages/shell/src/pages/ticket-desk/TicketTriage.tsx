import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { MenuItem, Stack, TextField } from '@/components/ui';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { enumOptions } from '@/utils/enumOptions';
import {
  SupportCategory,
  SupportPriority,
  useSetSupportTicketTriageMutation,
} from '@/graphql/generated';

const CATEGORY_OPTIONS = enumOptions(Object.values(SupportCategory));
const PRIORITY_OPTIONS = enumOptions(Object.values(SupportPriority));

interface TicketTriageProps {
  ticketId: string;
  category: string;
  priority: string;
  topic: string;
  /** The desk's topic list (IT's, from its settings). No topic picker when omitted. */
  topics?: readonly string[];
  onChanged: () => void;
}

type Triage = { category: string; priority: string; topic: string };

/**
 * Re-triage: the team a ticket belongs to and how urgent it is. Employees pick
 * both when they raise a ticket, and they are often wrong about both. The saved
 * pair is held here so the selects show what was just chosen, not the row the
 * dialog was opened from.
 */
export function TicketTriage({
  ticketId,
  category: initialCategory,
  priority: initialPriority,
  topic: initialTopic,
  topics,
  onChanged,
}: Readonly<TicketTriageProps>) {
  const notify = useNotify();
  const t = useT();
  const [setTriage, { loading }] = useSetSupportTicketTriageMutation();
  const [triage, setTriageValue] = useState<Triage>({
    category: initialCategory,
    priority: initialPriority,
    topic: initialTopic,
  });

  const save = async (next: Triage) => {
    try {
      await setTriage({
        variables: {
          id: ticketId,
          category: next.category as SupportCategory,
          priority: next.priority as SupportPriority,
          topic: topics ? next.topic : undefined,
        },
      });
      setTriageValue(next);
      notify('Ticket triage updated');
      onChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  };

  const change = (field: keyof Triage) => (event: { target: { value: string } }) =>
    save({ ...triage, [field]: event.target.value });

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField
        select
        fullWidth
        label={t('Category')}
        value={triage.category}
        disabled={loading}
        onChange={change('category')}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        fullWidth
        label={t('Priority')}
        value={triage.priority}
        disabled={loading}
        onChange={change('priority')}
      >
        {PRIORITY_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      {topics && (
        <TextField
          select
          fullWidth
          label={t('Topic')}
          value={triage.topic}
          disabled={loading}
          onChange={change('topic')}
        >
          <MenuItem value="">{t('No topic')}</MenuItem>
          {topics.map((topic) => (
            <MenuItem key={topic} value={topic}>
              {topic}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Stack>
  );
}

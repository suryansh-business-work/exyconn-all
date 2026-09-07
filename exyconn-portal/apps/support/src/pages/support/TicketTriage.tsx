import { useState } from 'react';
import { MenuItem, Stack, TextField } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  SupportCategory,
  SupportPriority,
  useSetSupportTicketTriageMutation,
} from '@exyconn/shell/graphql/generated';

const CATEGORY_OPTIONS = enumOptions(Object.values(SupportCategory));
const PRIORITY_OPTIONS = enumOptions(Object.values(SupportPriority));

interface TicketTriageProps {
  ticketId: string;
  category: string;
  priority: string;
  onChanged: () => void;
}

type Triage = { category: string; priority: string };

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
  onChanged,
}: Readonly<TicketTriageProps>) {
  const notify = useNotify();
  const [setTriage, { loading }] = useSetSupportTicketTriageMutation();
  const [{ category, priority }, setTriageValue] = useState<Triage>({
    category: initialCategory,
    priority: initialPriority,
  });

  const save = async (next: Triage) => {
    try {
      await setTriage({
        variables: {
          id: ticketId,
          category: next.category as SupportCategory,
          priority: next.priority as SupportPriority,
        },
      });
      setTriageValue(next);
      notify('Ticket triage updated');
      onChanged();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  };

  return (
    <Stack direction="row" spacing={1.5}>
      <TextField
        select
        fullWidth
        label="Category"
        value={category}
        disabled={loading}
        onChange={(event) => save({ category: event.target.value, priority })}
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
        label="Priority"
        value={priority}
        disabled={loading}
        onChange={(event) => save({ category, priority: event.target.value })}
      >
        {PRIORITY_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}

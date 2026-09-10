import { MenuItem, TextField } from '@exyconn/shell/components/ui';
import { useListActiveCannedRepliesQuery } from '@exyconn/shell/graphql/generated';

interface Props {
  /** Called with the snippet's text. The form decides where it lands. */
  onPick: (body: string) => void;
}

/**
 * Drops a saved snippet into the message being written.
 *
 * Renders nothing when the desk has saved none, rather than an empty dropdown that looks
 * broken. It never sends anything — a snippet is where a reply starts, not what it is.
 */
export function CannedReplyPicker({ onPick }: Readonly<Props>) {
  const { data } = useListActiveCannedRepliesQuery();
  const snippets = data?.listActiveCannedReplies ?? [];
  if (snippets.length === 0) return null;

  return (
    <TextField
      select
      size="small"
      label="Insert a canned reply"
      // Always shows the prompt rather than the last pick: this is an action, not a setting.
      value=""
      onChange={(event) => {
        const chosen = snippets.find((snippet) => snippet.id === event.target.value);
        if (chosen) onPick(chosen.body);
      }}
      helperText="Drops the text in so you can edit it before sending"
    >
      {snippets.map((snippet) => (
        <MenuItem key={snippet.id} value={snippet.id}>
          {snippet.title}
        </MenuItem>
      ))}
    </TextField>
  );
}

import { FormControl, InputLabel, MenuItem, Select } from '@exyconn/shell/components/ui';
import { SprintState, type SprintFieldsFragment } from '@exyconn/shell/graphql/generated';
import { BACKLOG } from '../sprints/sprint-progress';

interface SprintSelectorProps {
  sprints: readonly SprintFieldsFragment[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * What the board is showing: one sprint, the backlog, or everything.
 *
 * A completed sprint stays in the list — the most common reason to look at one is to answer
 * a question about what happened in it, and a filter that hid finished sprints would make
 * that impossible from the board.
 */
export function SprintSelector({ sprints, value, onChange }: Readonly<SprintSelectorProps>) {
  return (
    <FormControl size="small" sx={{ minWidth: 190 }}>
      <InputLabel id="board-sprint-label">Sprint</InputLabel>
      <Select
        labelId="board-sprint-label"
        label="Sprint"
        value={value}
        onChange={(event) => onChange(String(event.target.value))}
      >
        <MenuItem value="">All tickets</MenuItem>
        <MenuItem value={BACKLOG}>Backlog</MenuItem>
        {sprints.map((sprint) => (
          <MenuItem key={sprint.id} value={sprint.id}>
            {sprint.name}
            {sprint.state === SprintState.Active ? ' · running' : ''}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

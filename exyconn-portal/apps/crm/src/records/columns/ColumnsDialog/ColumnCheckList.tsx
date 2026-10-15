import { useT } from '@exyconn/i18n';
import {
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@exyconn/shell/components/ui';
import type { ColumnChoice } from '../buildColumns';
import { choiceLabel } from './choiceLabel';

interface ColumnCheckListProps {
  heading: string;
  choices: readonly ColumnChoice[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

/** One group of the Columns dialog's checkbox list — Built-in or Custom. */
export function ColumnCheckList({
  heading,
  choices,
  selected,
  onToggle,
}: Readonly<ColumnCheckListProps>) {
  const t = useT();
  if (choices.length === 0) {
    return null;
  }
  return (
    <List dense subheader={<ListSubheader disableSticky>{t(heading)}</ListSubheader>}>
      {choices.map((choice) => {
        const label = choiceLabel(t, choice);
        const labelId = `column-choice-${choice.id}`;
        return (
          <ListItem key={choice.id} disablePadding>
            <ListItemButton onClick={() => onToggle(choice.id)} dense>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selected.has(choice.id)}
                  tabIndex={-1}
                  disableRipple
                  slotProps={{ input: { 'aria-labelledby': labelId } }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={label} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

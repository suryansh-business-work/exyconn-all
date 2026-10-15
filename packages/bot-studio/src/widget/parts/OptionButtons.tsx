import type { RenderedOption } from '@exyconn/wa-flow';
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@exyconn/shell/components/ui';
import { useWidgetActions } from '../WidgetActions';

interface OptionsProps {
  options: readonly RenderedOption[];
  /** The text of the message the options answer, quoted with the visitor's choice. */
  quoted: string;
}

/** Quick replies under a message, as a website chat shows them: pill buttons. */
export function OptionButtons({ options, quoted }: Readonly<OptionsProps>) {
  const { choose, look } = useWidgetActions();
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {options.map((option) => (
        <Button
          key={option.id}
          size="small"
          variant="outlined"
          onClick={() => choose(option, quoted)}
          sx={{ color: look.text, borderColor: look.text, textTransform: 'none' }}
        >
          {option.title}
        </Button>
      ))}
    </Box>
  );
}

interface OptionListProps {
  /** The list's own caption (WhatsApp's "View options" button). */
  caption: string;
  sections: readonly { id: string; title: string; rows: readonly RenderedOption[] }[];
  quoted: string;
}

/** A list message, laid open: a website has room to show every row at once. */
export function OptionList({ caption, sections, quoted }: Readonly<OptionListProps>) {
  const { choose, look } = useWidgetActions();
  return (
    <Box sx={{ mt: 1, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Typography
        variant="caption"
        component="p"
        sx={{ px: 1.5, py: 1, bgcolor: 'action.hover', fontWeight: 600 }}
      >
        {caption}
      </Typography>
      {sections.map((section) => (
        <List key={section.id} dense disablePadding aria-label={section.title}>
          {sections.length > 1 && (
            <Typography variant="overline" component="p" sx={{ px: 1.5, color: look.text }}>
              {section.title}
            </Typography>
          )}
          {section.rows.map((row) => (
            <ListItemButton key={row.id} onClick={() => choose(row, quoted)} divider>
              <ListItemText primary={row.title} secondary={row.description} />
            </ListItemButton>
          ))}
        </List>
      ))}
    </Box>
  );
}

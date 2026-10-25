import { Avatar, Box, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { clock, type SpeakerGroup } from './groups';

/** One speaker's run of lines: their initial, name and start time, then what they said. */
export function SpeakerBlock({ group }: Readonly<{ group: SpeakerGroup }>) {
  const t = useT();
  const name = group.speakerLabel ?? t('Speaker');
  return (
    <Stack component="li" direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Avatar
        alt=""
        aria-hidden
        sx={{
          width: 28,
          height: 28,
          fontSize: 'caption.fontSize',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          <Typography variant="subtitle2" component="span" noWrap>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="span">
            {clock(group.startMs)}
          </Typography>
        </Stack>
        <Stack spacing={0.5} sx={{ mt: 0.25 }}>
          {group.lines.map((line) => (
            <Typography
              key={line.id}
              variant="body2"
              sx={{ lineHeight: 1.55, overflowWrap: 'anywhere' }}
            >
              {line.text}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

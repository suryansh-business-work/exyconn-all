import type { ContactCard as Contact, LocationPin, RenderedCta } from '@exyconn/wa-flow';
import { useT } from '@exyconn/i18n';
import CallIcon from '@mui/icons-material/Call';
import EventIcon from '@mui/icons-material/Event';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlaceIcon from '@mui/icons-material/PlaceOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import { Box, Button, Link, Paper, Typography } from '@exyconn/shell/components/ui';
import { downloadIcs } from '../../shared/ics';
import { useWidgetActions } from '../WidgetActions';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=';

/** Link, call and add-to-calendar buttons. */
export function CtaActions({ actions }: Readonly<{ actions: readonly RenderedCta[] }>) {
  const { followAction, look } = useWidgetActions();
  const sx = {
    color: look.text,
    borderColor: look.text,
    textTransform: 'none',
    justifyContent: 'flex-start',
  } as const;
  return (
    <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
      {actions.map((action) => {
        if (action.kind === 'calendar') {
          return (
            <Button
              key={action.title}
              variant="outlined"
              sx={sx}
              startIcon={<EventIcon />}
              onClick={() => downloadIcs(action.event, 'booking.ics')}
            >
              {action.title}
            </Button>
          );
        }
        const target = action.kind === 'url' ? action.url : action.phone;
        const icon = action.kind === 'url' ? <OpenInNewIcon /> : <CallIcon />;
        return (
          <Button
            key={action.title}
            variant="outlined"
            sx={sx}
            startIcon={icon}
            onClick={() => followAction({ kind: action.kind, title: action.title, target })}
          >
            {action.title}
          </Button>
        );
      })}
    </Box>
  );
}

/** A place on the map, opened in Google Maps. */
export function LocationCard({
  location,
  caption,
}: Readonly<{ location: LocationPin; caption?: string }>) {
  const t = useT();
  const { look } = useWidgetActions();
  return (
    <Paper variant="outlined" sx={{ width: '100%', p: 1.5, display: 'flex', gap: 1.5 }}>
      <PlaceIcon sx={{ color: look.text }} aria-hidden />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
          {location.name}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {location.address}
        </Typography>
        {caption && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {caption}
          </Typography>
        )}
        <Link
          href={`${MAPS_URL}${location.lat},${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          sx={{ color: look.text, display: 'inline-block', mt: 0.5 }}
        >
          {t('Open in Maps')}
        </Link>
      </Box>
    </Paper>
  );
}

/** A person to reach: name, role and a call button. */
export function ContactCard({ contact }: Readonly<{ contact: Contact }>) {
  const { followAction, look } = useWidgetActions();
  const role = [contact.role, contact.organisation].filter(Boolean).join(' · ');
  return (
    <Paper
      variant="outlined"
      sx={{ width: '100%', p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}
    >
      <PersonIcon sx={{ color: look.text }} aria-hidden />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
          {contact.name}
        </Typography>
        {role && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {role}
          </Typography>
        )}
      </Box>
      <Button
        size="small"
        startIcon={<CallIcon />}
        onClick={() => followAction({ kind: 'call', title: contact.name, target: contact.phone })}
        sx={{ color: look.text, textTransform: 'none' }}
      >
        {contact.phone}
      </Button>
    </Paper>
  );
}

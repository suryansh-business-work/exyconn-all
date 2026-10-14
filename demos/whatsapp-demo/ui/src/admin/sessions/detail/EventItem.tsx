import { useEffect, useRef } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Box,
  Chip,
  Stack,
  Typography,
  borderWidth,
  fontWeight,
  iconSize,
  radius,
  transition,
} from '@exyconn/shell/components/ui';
import {
  WhatsappDemoEventType,
  type WhatsappDemoSessionQuery,
} from '@exyconn/shell/graphql/generated';
import { formatDemoDuration } from '../../shared/duration';
import { EVENT_KINDS, readAiMeta } from './eventKinds';

type SessionDetail = NonNullable<WhatsappDemoSessionQuery['whatsappDemoSession']>;
export type DemoEvent = SessionDetail['events'][number];

interface EventItemProps {
  event: DemoEvent;
  /** The event the replay is on. */
  current: boolean;
  industryName: (demoKey: string) => string;
  /** Scroll without animation when the person prefers reduced motion. */
  reducedMotion: boolean;
}

/** Where in the demo the event happened: industry › workflow › node, whichever are known. */
function placeOf(event: DemoEvent, industryName: (demoKey: string) => string): string {
  const parts = [
    event.demoKey ? industryName(event.demoKey) : null,
    event.workflow,
    event.node,
  ].filter((part): part is string => Boolean(part));
  return parts.join(' › ');
}

/** The AI call's outcome as a chip: latency, and whether it parsed. */
function AiChip({ meta }: Readonly<{ meta: unknown }>) {
  const t = useT();
  const ai = readAiMeta(meta);
  if (!ai) {
    return null;
  }
  const latency = ai.latencyMs === null ? '' : t('{ms} ms', { ms: ai.latencyMs });
  const outcome = ai.ok ? t('OK') : t('Failed: {reason}', { reason: ai.error ?? t('unknown') });
  return (
    <Chip
      size="small"
      variant="outlined"
      color={ai.ok ? 'success' : 'error'}
      label={[outcome, latency].filter(Boolean).join(' · ')}
    />
  );
}

/** One event on a session's timeline; the current one of a replay is marked and scrolled to. */
export function EventItem({
  event,
  current,
  industryName,
  reducedMotion,
}: Readonly<EventItemProps>) {
  const t = useT();
  const { formatTime } = useFormatters();
  const ref = useRef<HTMLLIElement>(null);
  const kind = EVENT_KINDS[event.type];
  const Icon = kind.icon;
  const place = placeOf(event, industryName);

  useEffect(() => {
    if (current) {
      ref.current?.scrollIntoView({
        block: 'nearest',
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [current, reducedMotion]);

  return (
    <Box
      component="li"
      ref={ref}
      aria-current={current ? 'step' : undefined}
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 1,
        borderRadius: `${radius.sm}px`,
        borderLeft: `${borderWidth.accent}px solid`,
        borderColor: current ? 'primary.main' : 'transparent',
        bgcolor: current ? 'action.selected' : 'transparent',
        transition: reducedMotion ? 'none' : transition.surface,
      }}
    >
      <Box
        aria-hidden
        sx={{ color: 'text.secondary', pt: 0.5, '& svg': { fontSize: iconSize.md } }}
      >
        <Icon />
      </Box>
      <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          <Typography variant="body2" sx={{ fontWeight: fontWeight.semibold, flex: 1 }}>
            {t(kind.label)}
          </Typography>
          <Typography
            variant="caption"
            component="time"
            dateTime={event.at}
            sx={{ color: 'text.secondary' }}
          >
            {formatTime(event.at)}
          </Typography>
        </Stack>
        {place && (
          <Typography variant="caption" sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
            {place}
          </Typography>
        )}
        {event.label && <Typography variant="body2">{event.label}</Typography>}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {event.durationMs != null && (
            <Chip
              size="small"
              label={t('Took {duration}', { duration: formatDemoDuration(event.durationMs) })}
            />
          )}
          {event.type === WhatsappDemoEventType.AiCall && <AiChip meta={event.meta} />}
        </Stack>
      </Stack>
    </Box>
  );
}

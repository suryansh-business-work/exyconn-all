import { useFormatters, useT } from '@exyconn/i18n';
import { ButtonBase, Link, Text } from '@exyconn/shell/components/ui';
import { postTime } from '../calendar.days';
import { NETWORK_LABEL, UNSENT } from '../social.labels';
import { STATUS_TONE, type CalendarPostRow } from './calendar.status';

interface CalendarPostItemProps {
  post: CalendarPostRow;
  onEdit: (post: CalendarPostRow) => void;
}

/**
 * One post in a day: a post still to go out opens for editing, one that went out links to
 * the network, and one being published right now is only shown.
 */
export function CalendarPostItem({ post, onEdit }: Readonly<CalendarPostItemProps>) {
  const t = useT();
  const { formatTime } = useFormatters();
  const tone = STATUS_TONE[post.status] ?? STATUS_TONE.SCHEDULED;
  const label = `${NETWORK_LABEL[post.network]} ${formatTime(postTime(post))} · ${t(tone.label)}`;
  const title = `${t(tone.label)}: ${post.text}`;
  const sx = {
    display: 'block',
    width: '100%',
    // WCAG 2.2 target size: every post that can be clicked is at least 24px tall.
    minHeight: 24,
    mt: 0.5,
    pl: 0.5,
    borderLeft: 3,
    borderColor: tone.tone,
    textAlign: 'left',
    pointerEvents: 'auto',
  } as const;
  const content = (
    <Text component="span" size="caption" noWrap sx={{ display: 'block' }}>
      {label}
    </Text>
  );

  if (UNSENT.has(post.status)) {
    return (
      <ButtonBase
        onClick={() => onEdit(post)}
        aria-label={t('Edit post: {label}', { label })}
        title={title}
        sx={sx}
      >
        {content}
      </ButtonBase>
    );
  }
  if (post.permalink) {
    return (
      <Link
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('Open on the network: {label}', { label })}
        title={title}
        color="inherit"
        underline="hover"
        sx={sx}
      >
        {content}
      </Link>
    );
  }
  return (
    <Text component="span" size="caption" noWrap title={title} sx={sx}>
      {label}
    </Text>
  );
}

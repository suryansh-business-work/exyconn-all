import { Box } from '@exyconn/shell/components/ui';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CallIcon from '@mui/icons-material/Call';
import EventIcon from '@mui/icons-material/Event';
import type { RenderedCta } from '@exyconn/wa-flow';
import { WA_SIZE } from '../../../theme/wa.tokens';
import { useChatActions, type ChatActions } from '../ChatActions';
import { ActionRows, type ActionRowItem } from './ActionRows';
import { Bubble } from './Bubble';
import { downloadIcs } from './ics';
import { MessageText } from './MessageText';
import type { ContentProps } from './types';

function toRow(action: RenderedCta, actions: ChatActions): ActionRowItem {
  const id = `${action.kind}-${action.title}`;
  switch (action.kind) {
    case 'calendar':
      return {
        id,
        label: action.title,
        icon: <EventIcon fontSize="small" />,
        onClick: () => downloadIcs(action.event, 'appointment.ics'),
      };
    case 'call':
      return {
        id,
        label: action.title,
        icon: <CallIcon fontSize="small" />,
        onClick: () => actions.explainExternal(action.phone),
      };
    default:
      return {
        id,
        label: action.title,
        icon: <OpenInNewIcon fontSize="small" />,
        onClick: () => actions.explainExternal(action.url),
      };
  }
}

/** A message with call-to-action buttons: open a link, call, add to calendar. */
export function CtaMessage({ content, frame }: ContentProps<'cta'>) {
  const actions = useChatActions();
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time}>
        <MessageText header={content.header} text={content.text} footer={content.footer} />
      </Bubble>
      <ActionRows items={content.actions.map((a) => toRow(a, actions))} />
    </Box>
  );
}

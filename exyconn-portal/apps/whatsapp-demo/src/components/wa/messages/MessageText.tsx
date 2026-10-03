import { Box } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_SPACE } from '../../../theme/wa.tokens';
import { FormattedText } from './FormattedText';

interface MessageTextProps {
  header?: string;
  text?: string;
  footer?: string;
  /** A human agent's name, over their messages after a handoff. */
  sender?: string;
}

/** Header, body and footer of a message, as WhatsApp stacks them inside a bubble. */
export function MessageText({ header, text, footer, sender }: Readonly<MessageTextProps>) {
  const c = useWaPalette();
  return (
    <>
      {sender ? (
        <Box sx={{ color: c.accents.orange, fontSize: WA_FONT.small, fontWeight: 600 }}>
          {sender}
        </Box>
      ) : null}
      {header ? (
        <Box sx={{ fontWeight: 700, fontSize: WA_FONT.title, mb: WA_SPACE.xxs }}>
          <FormattedText text={header} />
        </Box>
      ) : null}
      {text ? <FormattedText text={text} /> : null}
      {footer ? (
        <Box sx={{ color: c.textMuted, fontSize: WA_FONT.small, mt: WA_SPACE.xxs }}>{footer}</Box>
      ) : null}
    </>
  );
}

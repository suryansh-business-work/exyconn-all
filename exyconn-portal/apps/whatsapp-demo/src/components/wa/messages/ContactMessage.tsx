import { useT } from '@exyconn/i18n';
import { Box, ButtonBase } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { useChatActions } from '../ChatActions';
import { WaAvatar } from '../common/WaAvatar';
import { Bubble } from './Bubble';
import type { ContentProps } from './types';

/** A shared contact card, with Message and Call like the real thing. */
export function ContactMessage({ content, frame }: ContentProps<'contact'>) {
  const t = useT();
  const c = useWaPalette();
  const { explainExternal } = useChatActions();
  const { contact } = content;
  const subtitle = [contact.role, contact.organisation].filter(Boolean).join(' · ');
  const action = {
    flex: 1,
    py: WA_SPACE.sm,
    color: c.link,
    fontFamily: 'inherit',
    fontSize: WA_FONT.preview,
    fontWeight: 500,
  };
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: WA_SPACE.md, pb: WA_SPACE.sm }}>
          <WaAvatar size={WA_SIZE.avatarHeader} accent="slate" icon="person" />
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontWeight: 600, fontSize: WA_FONT.preview }}>{contact.name}</Box>
            {subtitle ? (
              <Box sx={{ fontSize: WA_FONT.small, color: c.textMuted }}>{subtitle}</Box>
            ) : null}
            <Box sx={{ fontSize: WA_FONT.small, color: c.textMuted }}>{contact.phone}</Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            borderTop: `${WA_LINE.hair} solid ${c.divider}`,
            mx: `-${WA_SPACE.sm}`,
          }}
        >
          <ButtonBase sx={action} onClick={() => explainExternal(contact.phone)}>
            {t('Message')}
          </ButtonBase>
          <ButtonBase
            sx={{ ...action, borderLeft: `${WA_LINE.hair} solid ${c.divider}` }}
            onClick={() => explainExternal(contact.phone)}
          >
            {t('Call')}
          </ButtonBase>
        </Box>
      </Bubble>
    </Box>
  );
}

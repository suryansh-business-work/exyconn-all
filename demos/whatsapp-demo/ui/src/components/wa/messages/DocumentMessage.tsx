import { useT } from '@exyconn/i18n';
import { Box, ButtonBase } from '@exyconn/shell/components/ui';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { useChatActions } from '../ChatActions';
import { Bubble } from './Bubble';
import { MessageText } from './MessageText';
import type { ContentProps } from './types';

/** A file attachment: icon, name and "3 pages · PDF · 245 kB"; opens a preview. */
export function DocumentMessage({ content, frame }: ContentProps<'document'>) {
  const t = useT();
  const c = useWaPalette();
  const { openDocument } = useChatActions();
  const { document } = content;
  const Icon = document.fileType === 'PDF' ? PictureAsPdfIcon : DescriptionIcon;
  const pages = t(document.pages === 1 ? '1 page' : '{count} pages', { count: document.pages });
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time} flush>
        <ButtonBase
          onClick={() => openDocument(document)}
          aria-label={t('Open {name}', { name: document.fileName })}
          sx={{
            width: '100%',
            justifyContent: 'flex-start',
            gap: WA_SPACE.sm,
            p: WA_SPACE.md,
            borderRadius: WA_RADIUS.card,
            bgcolor: c.quote,
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <Icon
            sx={{
              color: document.fileType === 'PDF' ? c.danger : c.link,
              fontSize: WA_SIZE.iconButton,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                fontSize: WA_FONT.preview,
                color: c.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {document.fileName}
            </Box>
            <Box sx={{ fontSize: WA_FONT.small, color: c.textMuted }}>
              {pages} · {document.fileType} · {t('{size} kB', { size: document.sizeKb })}
            </Box>
          </Box>
        </ButtonBase>
        {content.caption ? (
          <Box sx={{ p: `${WA_SPACE.xs} ${WA_SPACE.sm} 0` }}>
            <MessageText text={content.caption} />
          </Box>
        ) : null}
      </Bubble>
    </Box>
  );
}

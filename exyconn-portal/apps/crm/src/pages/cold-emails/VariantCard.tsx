import { useState } from 'react';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Button, Chip, Flex, Stack, Text, lineHeight } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { ColdEmailVariantFieldsFragment } from '@exyconn/shell/graphql/generated';
import { useToneLabel } from '../../records/cold-email';

/** Lines of the message shown before "Show all". */
const PREVIEW_LINES = 6;

interface VariantCardProps {
  variant: ColdEmailVariantFieldsFragment;
  /** Its number among the draft's versions, oldest first. */
  number: number;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUse: () => void;
}

/** One version: subject, message, when it was written and what it cost; sent ones are locked. */
export function VariantCard({
  variant,
  number,
  busy,
  onEdit,
  onDelete,
  onUse,
}: Readonly<VariantCardProps>) {
  const t = useT();
  const toneLabel = useToneLabel();
  const { formatCurrency, formatDateTime } = useFormatters();
  const [expanded, setExpanded] = useState(false);
  const sent = Boolean(variant.sentAt);
  const cost = formatCurrency(variant.costUsd, { currency: 'USD', maximumFractionDigits: 4 });
  const headingId = `variant-${variant.id}`;
  const clamp = expanded
    ? undefined
    : {
        display: '-webkit-box',
        WebkitLineClamp: PREVIEW_LINES,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      };
  const written = { when: formatDateTime(variant.createdAt), cost };
  const caption = variant.instruction
    ? t('Written {when} · cost {cost} · asked: {instruction}', {
        ...written,
        instruction: variant.instruction,
      })
    : t('Written {when} · cost {cost}', written);

  return (
    <Box component="article" aria-labelledby={headingId} sx={panel}>
      <Stack spacing={1.5}>
        <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Text component="span" size="caption" color="text.secondary">
            {t('Version {number}', { number })}
          </Text>
          <Chip size="small" variant="outlined" label={toneLabel(variant.tone)} />
          {sent && (
            <Chip
              size="small"
              color="success"
              label={t('Sent {when}', { when: formatDateTime(variant.sentAt) })}
            />
          )}
        </Flex>
        <Text id={headingId} component="h3" weight="bold" sx={{ overflowWrap: 'anywhere' }}>
          {variant.subject}
        </Text>
        <Text
          component="p"
          size="sm"
          sx={{
            m: 0,
            whiteSpace: 'pre-line',
            overflowWrap: 'anywhere',
            lineHeight: lineHeight.relaxed,
            ...clamp,
          }}
        >
          {variant.body}
        </Text>
        <Button
          size="small"
          variant="text"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          sx={{ alignSelf: 'flex-start' }}
        >
          {expanded ? t('Show less') : t('Show all')}
        </Button>
        <Text component="p" size="caption" color="text.secondary" sx={{ m: 0 }}>
          {caption}
        </Text>
        <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="contained"
            startIcon={<SendIcon />}
            onClick={onUse}
            disabled={sent}
          >
            {t('Use this')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={onEdit}
            disabled={sent}
          >
            {t('Edit')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDelete}
            disabled={sent || busy}
          >
            {t('Delete')}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}

import type { ReactElement } from 'react';
import ArchiveIcon from '@mui/icons-material/Archive';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import DraftsIcon from '@mui/icons-material/Drafts';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import { useFormatters, useT } from '@exyconn/i18n';
import { Checkbox, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { CrmMailAction } from '@exyconn/shell/graphql/generated';

interface MailListToolbarProps {
  selected: number;
  onPage: number;
  total: number;
  page: number;
  pageSize: number;
  busy: boolean;
  onSelectAll: (all: boolean) => void;
  onAction: (action: CrmMailAction) => void;
  onPageChange: (page: number) => void;
}

const BULK: ReadonlyArray<{ action: CrmMailAction; label: string; icon: ReactElement }> = [
  { action: CrmMailAction.MarkRead, label: 'Mark as read', icon: <DraftsIcon /> },
  { action: CrmMailAction.MarkUnread, label: 'Mark as unread', icon: <MarkEmailUnreadIcon /> },
  { action: CrmMailAction.Archive, label: 'Archive', icon: <ArchiveIcon /> },
  { action: CrmMailAction.Trash, label: 'Move to trash', icon: <DeleteIcon /> },
];

/** Select all, what to do with the selection, and which page of the folder this is. */
export function MailListToolbar({
  selected,
  onPage,
  total,
  page,
  pageSize,
  busy,
  onSelectAll,
  onAction,
  onPageChange,
}: Readonly<MailListToolbarProps>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  const first = total === 0 ? 0 : page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, total);
  const range = t('{first}–{last} of {total}', {
    first: formatNumber(first),
    last: formatNumber(last),
    total: formatNumber(total),
  });
  return (
    <Flex
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      useFlexGap
    >
      <Flex direction="row" alignItems="center" spacing={0.5}>
        <Checkbox
          checked={onPage > 0 && selected === onPage}
          indeterminate={selected > 0 && selected < onPage}
          disabled={onPage === 0}
          onChange={(event) => onSelectAll(event.target.checked)}
          slotProps={{ input: { 'aria-label': t('Select every conversation on this page') } }}
        />
        {selected > 0 &&
          BULK.map((item) => (
            <Tooltip key={item.action} title={t(item.label)}>
              <span>
                <IconButton
                  onClick={() => onAction(item.action)}
                  aria-label={t(item.label)}
                  disabled={busy}
                >
                  {item.icon}
                </IconButton>
              </span>
            </Tooltip>
          ))}
      </Flex>
      <Flex direction="row" alignItems="center" spacing={0.5}>
        <Text size="caption" color="text.secondary" aria-live="polite">
          {range}
        </Text>
        <IconButton
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label={t('Newer')}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(page + 1)}
          disabled={last >= total}
          aria-label={t('Older')}
        >
          <ChevronRightIcon />
        </IconButton>
      </Flex>
    </Flex>
  );
}

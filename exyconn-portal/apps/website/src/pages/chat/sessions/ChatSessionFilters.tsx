import { useEffect, useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from '@exyconn/shell/components/ui';
import { WebsiteChatSite, WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import {
  EMPTY_CHAT_SESSION_FILTERS,
  hasChatSessionFilters,
  type ChatSessionFilterState,
} from './chat-sessions.filters';
import { DayRangeFilter } from './DayRangeFilter';
import { SITE_LABEL } from './chat-sessions-grid';

interface ChatSessionFiltersProps {
  value: ChatSessionFilterState;
  onChange: (next: ChatSessionFilterState) => void;
}

const FIELD = { fullWidth: true, size: 'small' } as const;
const STATUS_LABEL: Record<WebsiteChatStatus, string> = {
  [WebsiteChatStatus.Open]: 'Open',
  [WebsiteChatStatus.Closed]: 'Closed',
};
/** The assignee box waits for typing to pause before it asks the server again. */
const TYPING_PAUSE_MS = 400;

/** Status, site, assignee, unread and two date ranges above the chat list. */
export function ChatSessionFilters({ value, onChange }: Readonly<ChatSessionFiltersProps>) {
  const t = useT();
  const [assignee, setAssignee] = useState(value.assignee);
  const set = <K extends keyof ChatSessionFilterState>(key: K, next: ChatSessionFilterState[K]) =>
    onChange({ ...value, [key]: next });

  useEffect(() => setAssignee(value.assignee), [value.assignee]);
  useEffect(() => {
    if (assignee === value.assignee) {
      return undefined;
    }
    const timer = setTimeout(() => onChange({ ...value, assignee }), TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [assignee, value, onChange]);

  return (
    <Grid container spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
      <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
        <TextField
          select
          {...FIELD}
          label={t('Status')}
          value={value.status}
          onChange={(event) => set('status', event.target.value)}
        >
          <MenuItem value="">{t('All statuses')}</MenuItem>
          {Object.values(WebsiteChatStatus).map((status) => (
            <MenuItem key={status} value={status}>
              {t(STATUS_LABEL[status])}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
        <TextField
          select
          {...FIELD}
          label={t('Site')}
          value={value.site}
          onChange={(event) => set('site', event.target.value)}
        >
          <MenuItem value="">{t('All sites')}</MenuItem>
          {Object.values(WebsiteChatSite).map((site) => (
            <MenuItem key={site} value={site}>
              {t(SITE_LABEL[site])}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 1.75 }}>
        <TextField
          {...FIELD}
          label={t('Assignee')}
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
        />
      </Grid>
      <DayRangeFilter
        fromLabel="Started from"
        toLabel="Started to"
        value={value.created}
        onChange={(created) => set('created', created)}
      />
      <DayRangeFilter
        fromLabel="Last message from"
        toLabel="Last message to"
        value={value.lastMessage}
        onChange={(lastMessage) => set('lastMessage', lastMessage)}
      />
      <Grid size={{ xs: 6, sm: 3, md: 1.25 }}>
        <FormControlLabel
          label={t('Unread only')}
          control={
            <Switch
              checked={value.unreadOnly}
              onChange={(event) => set('unreadOnly', event.target.checked)}
            />
          }
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3, md: 1 }}>
        <Button
          fullWidth
          variant="text"
          disabled={!hasChatSessionFilters(value)}
          onClick={() => onChange(EMPTY_CHAT_SESSION_FILTERS)}
        >
          {t('Clear')}
        </Button>
      </Grid>
    </Grid>
  );
}

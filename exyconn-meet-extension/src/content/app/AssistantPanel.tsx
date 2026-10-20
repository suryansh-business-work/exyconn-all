import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Paper, Stack, Tab, Tabs, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import CloseIcon from '@mui/icons-material/Close';
import { saveLayout } from '../../hooks/useLayout';
import type { PanelLayout } from '../../storage/layout';
import { CONTROL_BAR_CLEARANCE, EDGE_GAP } from '../../utils/floating-position';
import { PanelResizeHandle } from './PanelResizeHandle';
import { ActionItemsTab } from './tabs/ActionItemsTab';
import { NotesTab } from './tabs/NotesTab';
import { OverviewTab } from './tabs/OverviewTab';
import { ParticipantsTab } from './tabs/ParticipantsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { TranscriptTab } from './tabs/TranscriptTab';
import type { TabProps } from './tabs/types';
import { logTo } from '../../services/logger';

const SECTIONS = [
  { id: 'overview', label: 'Overview', Component: OverviewTab },
  { id: 'transcript', label: 'Live transcript', Component: TranscriptTab },
  { id: 'participants', label: 'Participants', Component: ParticipantsTab },
  { id: 'notes', label: 'AI notes', Component: NotesTab },
  { id: 'actions', label: 'Action items', Component: ActionItemsTab },
  { id: 'settings', label: 'Settings', Component: SettingsTab },
] as const;

interface Props extends TabProps {
  id: string;
  layout: PanelLayout;
  onClose: () => void;
}

/**
 * The side panel: six tabs, resizable from its right edge, closed with Escape. It sits on
 * the left and stops above Meet's control bar, so it never covers the call's own buttons.
 * Only the selected tab is mounted, so only it fetches.
 */
export function AssistantPanel({ id, layout, onClose, ...tabProps }: Readonly<Props>) {
  const t = useT();
  const [selected, setSelected] = useState(0);
  const [width, setWidth] = useState(layout.panelWidth);
  const section = SECTIONS[selected];
  const commitWidth = (next: number): void => {
    saveLayout({ ...layout, panelWidth: next }).catch(
      logTo(tabProps.logger, 'Could not save the panel width'),
    );
  };
  const panelRef = useRef<HTMLElement>(null);

  // Escape anywhere in the panel collapses it (and focus returns to the icon).
  useEffect(() => {
    const panel = panelRef.current;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    panel?.addEventListener('keydown', onKeyDown);
    return () => panel?.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <Paper
      id={id}
      component="aside"
      aria-label={t('Exyconn Meeting Assistant')}
      elevation={8}
      ref={panelRef}
      sx={{
        position: 'fixed',
        left: EDGE_GAP,
        top: EDGE_GAP,
        bottom: CONTROL_BAR_CLEARANCE,
        width,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1 }}
      >
        <Typography variant="subtitle1" component="h2">
          {t('Meeting assistant')}
        </Typography>
        <IconButton aria-label={t('Collapse the panel')} onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Tabs
        value={selected}
        onChange={(_event, next: number) => setSelected(next)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label={t('Assistant sections')}
      >
        {SECTIONS.map((item, index) => (
          <Tab
            key={item.id}
            label={t(item.label)}
            id={`${id}-tab-${item.id}`}
            aria-controls={`${id}-panel-${item.id}`}
            value={index}
          />
        ))}
      </Tabs>
      <Box
        role="tabpanel"
        id={`${id}-panel-${section.id}`}
        aria-labelledby={`${id}-tab-${section.id}`}
        tabIndex={0}
        sx={{ flex: 1, overflowY: 'auto', p: 2 }}
      >
        <section.Component {...tabProps} />
      </Box>
      <PanelResizeHandle width={width} onResize={setWidth} onCommit={commitWidth} />
    </Paper>
  );
}

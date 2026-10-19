import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, useTheme } from '@exyconn/shell/components/ui';
import {
  closeComms,
  minimizeComms,
  restoreComms,
  useCommsDock,
  type CommsPanel,
} from './commsStore';
import { CHANNELS } from './channels';
import { CommsPanelFrame } from './CommsPanelFrame';
import { CommsPanelBody } from './panels/CommsPanelBody';

/** "SMS · Acme": the channel and who it is with. */
function useTitle() {
  const t = useT();
  return (panel: CommsPanel) => `${t(CHANNELS[panel.channel].label)} · ${panel.name}`;
}

/** After minimizing, focus goes to the panel's pill so the keyboard user is not dropped. */
function focusPill(key: string) {
  globalThis.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-comms-pill="${CSS.escape(key)}"]`)?.focus();
  });
}

/**
 * The communication dock, mounted once around the CRM's pages: at most one expanded panel, and
 * the others as pills along the bottom-right that restore on click.
 */
export function CommsDock() {
  const t = useT();
  const theme = useTheme();
  const titleOf = useTitle();
  const { panels, position } = useCommsDock();
  const pills = panels.filter((panel) => panel.minimized);
  const open = panels.find((panel) => !panel.minimized);

  return (
    <>
      {pills.length > 0 && (
        <Flex
          component="nav"
          aria-label={t('Minimized conversations')}
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          justifyContent="flex-end"
          sx={{
            position: 'fixed',
            right: theme.spacing(2),
            bottom: theme.spacing(2),
            left: { xs: theme.spacing(2), sm: 'auto' },
            zIndex: theme.zIndex.appBar + 1,
          }}
        >
          {pills.map((panel) => (
            <Button
              key={panel.key}
              data-comms-pill={panel.key}
              size="small"
              variant="contained"
              startIcon={CHANNELS[panel.channel].icon}
              onClick={() => restoreComms(panel.key)}
              aria-label={t('Restore {title}', { title: titleOf(panel) })}
              sx={{ maxWidth: theme.spacing(30) }}
            >
              <Box
                component="span"
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {titleOf(panel)}
              </Box>
            </Button>
          ))}
        </Flex>
      )}
      {open && (
        <CommsPanelFrame
          key={open.key}
          panel={open}
          title={titleOf(open)}
          position={position}
          abovePills={pills.length > 0}
          onMinimize={() => {
            minimizeComms(open.key);
            focusPill(open.key);
          }}
          onClose={() => closeComms(open.key)}
        >
          <CommsPanelBody panel={open} onClose={() => closeComms(open.key)} />
        </CommsPanelFrame>
      )}
    </>
  );
}

import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, useTheme } from '@/components/ui';
import {
  closeDockPanel,
  minimizeDockPanel,
  restoreDockPanel,
  useDock,
  type DockPanel,
} from './dockStore';
import { DockPanelFrame } from './DockPanelFrame';

/** "Email · ada@acme.io": the window's title and who it is with. */
function useTitle() {
  const t = useT();
  return (panel: DockPanel) =>
    panel.subject ? `${t(panel.title)} · ${panel.subject}` : t(panel.title);
}

/** After minimizing, focus goes to the panel's pill so the keyboard user is not dropped. */
function focusPill(key: string) {
  globalThis.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-dock-pill="${CSS.escape(key)}"]`)?.focus();
  });
}

/**
 * The floating window dock, mounted once in the portal layout: at most one expanded window
 * (an email, a call, a text), and the others as pills along the bottom-right that restore on
 * click. Windows survive navigation; the page beneath stays usable.
 */
export function DockHost() {
  const t = useT();
  const theme = useTheme();
  const titleOf = useTitle();
  const { panels, position, size, maximized } = useDock();
  const pills = panels.filter((panel) => panel.minimized);
  const open = panels.find((panel) => !panel.minimized);

  return (
    <>
      {pills.length > 0 && (
        <Flex
          component="nav"
          aria-label={t('Minimized windows')}
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
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          {pills.map((panel) => (
            <Button
              key={panel.key}
              data-dock-pill={panel.key}
              size="small"
              variant="contained"
              startIcon={panel.icon}
              onClick={() => restoreDockPanel(panel.key)}
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
        <DockPanelFrame
          key={open.key}
          panel={open}
          title={titleOf(open)}
          position={position}
          size={size}
          maximized={maximized}
          abovePills={pills.length > 0}
          onMinimize={() => {
            minimizeDockPanel(open.key);
            focusPill(open.key);
          }}
          onClose={() => closeDockPanel(open.key)}
        >
          <open.Body panel={open} onClose={() => closeDockPanel(open.key)} />
        </DockPanelFrame>
      )}
    </>
  );
}

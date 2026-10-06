import type { CmsEditRequest } from '@exyconn/live-editor';
import { useT } from '@exyconn/i18n';
import { Box, Drawer, Text } from '@exyconn/shell/components/ui';
import { ComponentPropsForm } from '../../website/forms/cms-component-props';

interface PropsDrawerProps {
  /** The component whose settings are open; null closes the drawer. */
  request: CmsEditRequest | null;
  siteId: string;
  onClose: () => void;
}

/** The settings of a dynamic component on the canvas, applied back into the page. */
export function PropsDrawer({ request, siteId, onClose }: Readonly<PropsDrawerProps>) {
  const t = useT();
  return (
    <Drawer
      anchor="right"
      open={request !== null}
      onClose={onClose}
      // A temporary drawer sits at the drawer layer, under the full-screen builder.
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
    >
      <Box
        sx={{ width: { xs: '100vw', sm: 520 }, p: 2 }}
        role="region"
        aria-label={t('Component settings')}
      >
        {request && (
          <>
            <Text weight="bold" size="lg" component="h2">
              {request.label}
            </Text>
            <Text size="caption" color="text.secondary" component="p" sx={{ mb: 2 }}>
              {request.key}
            </Text>
            <ComponentPropsForm
              key={request.key}
              props={request.props}
              siteId={siteId}
              onCancel={onClose}
              onApply={(props) => {
                request.apply(props);
                onClose();
              }}
            />
          </>
        )}
      </Box>
    </Drawer>
  );
}

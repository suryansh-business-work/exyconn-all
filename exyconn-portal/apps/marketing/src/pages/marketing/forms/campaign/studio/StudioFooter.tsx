import { useT } from '@exyconn/i18n';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { Box, Button, Flex } from '@exyconn/shell/components/ui';
import { SaveStatus } from './SaveStatus';
import type { CampaignDraftState } from './useCampaignDraft';

interface StudioFooterProps {
  draft: Pick<CampaignDraftState, 'status' | 'error' | 'dirty'>;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
}

/** Pinned to the bottom of the screen: where the draft stands, and the way forward. */
export function StudioFooter({
  draft,
  isFirst,
  isLast,
  busy,
  onBack,
  onNext,
  onSave,
}: Readonly<StudioFooterProps>) {
  const t = useT();
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 3,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        py: 1.5,
        mt: 2,
      }}
    >
      <Flex
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        gap={1}
      >
        <SaveStatus status={draft.status} error={draft.error} dirty={draft.dirty} />
        <Flex direction="row" gap={1} flexWrap="wrap">
          <Button onClick={onBack} disabled={isFirst || busy} startIcon={<ArrowBackIcon />}>
            {t('Back')}
          </Button>
          <Button
            variant="outlined"
            onClick={onSave}
            disabled={busy}
            startIcon={<SaveOutlinedIcon />}
          >
            {t('Save draft')}
          </Button>
          {!isLast && (
            <Button
              variant="contained"
              onClick={onNext}
              disabled={busy}
              endIcon={<ArrowForwardIcon />}
            >
              {t('Next')}
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

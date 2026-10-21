import { useT } from '@exyconn/i18n';
import { Alert, Box, Skeleton } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { sanitizeRichHtml } from '@exyconn/shell/utils/sanitizeHtml';
import { useClientHubSharedContentQuery } from '@exyconn/shell/graphql/generated';
import type { HubSharedItem } from './SharedItemCard';

interface SharedItemReaderProps {
  item: HubSharedItem | null;
  onClose: () => void;
}

/** The shared record's own text, read in place. Sanitised on the server and again here. */
export function SharedItemReader({ item, onClose }: Readonly<SharedItemReaderProps>) {
  const t = useT();
  const { data, loading, error } = useClientHubSharedContentQuery({
    variables: { id: item?.id ?? '' },
    skip: !item,
  });
  const html = data?.clientHubSharedContent;
  return (
    <CrudDialog open={item !== null} title={item?.title ?? ''} onClose={onClose}>
      {loading && <Skeleton variant="rectangular" height={200} aria-label={t('Loading')} />}
      {error && <Alert severity="error">{errorMessage(error, t('Could not open it'))}</Alert>}
      {html !== undefined && (
        <Box
          role="region"
          aria-label={t('Document text')}
          tabIndex={0}
          sx={(theme) => ({
            '& p': { my: 1 },
            '& ul, & ol': { pl: 3 },
            '& a': { color: theme.palette.primary.main, textDecoration: 'underline' },
          })}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
        />
      )}
    </CrudDialog>
  );
}

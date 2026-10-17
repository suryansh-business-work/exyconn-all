import { useT } from '@exyconn/i18n';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useDeleteWebScrapeMutation,
  type WebScrapeRowFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** Deletes one scraped page after the person confirms it. */
export function useDeleteScrape(onDeleted: () => void) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [deleteScrape, { loading }] = useDeleteWebScrapeMutation();

  const run = async (scrape: WebScrapeRowFieldsFragment) => {
    const ok = await confirm({
      title: 'Delete scraped page',
      message: 'Delete the scraped page "{name}"? Its text and AI answer go with it.',
      messageValues: { name: scrape.title || scrape.url },
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteScrape({ variables: { id: scrape.id } });
      notify(t('Scraped page deleted'), 'success');
      onDeleted();
    } catch (failure) {
      portalLogger.warn('crm: deleting a scraped page failed', failure);
      notify(errorMessage(failure, t('Could not delete the scraped page.')), 'error');
    }
  };

  return { run, deleting: loading };
}

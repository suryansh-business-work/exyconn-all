import { useCallback } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { downloadUrls } from '@exyconn/shell/utils/file';
import { useMaReleaseDownloadLinkMutation } from '@exyconn/shell/graphql/generated';

/**
 * Downloads one release: asks the server for a short-lived link and follows it. The checksum
 * is told to the person, so they can check the file they got is the one CI built.
 */
export function useReleaseDownload() {
  const notify = useNotify();
  const [createLink, { loading }] = useMaReleaseDownloadLinkMutation();
  const download = useCallback(
    async (id: string) => {
      try {
        const result = await createLink({ variables: { id } });
        const link = result.data?.maReleaseDownloadLink;
        if (link) {
          notify('Downloading {file}. Its SHA-256 is {sha256}', 'info', {
            file: link.fileName,
            sha256: link.sha256,
          });
          globalThis.location.assign(link.url);
        }
      } catch (error) {
        notify(errorMessage(error, 'The download could not be started.'), 'error');
      }
    },
    [createLink, notify],
  );

  /** Several builds at once: a link for each, then every file saved in one go. */
  const downloadMany = useCallback(
    async (ids: readonly string[]) => {
      try {
        const urls: string[] = [];
        for (const id of ids) {
          const result = await createLink({ variables: { id } });
          const url = result.data?.maReleaseDownloadLink.url;
          if (url) {
            urls.push(url);
          }
        }
        downloadUrls(urls);
        notify('Downloading {count} builds', 'info', { count: urls.length });
      } catch (error) {
        notify(errorMessage(error, 'The download could not be started.'), 'error');
      }
    },
    [createLink, notify],
  );
  return { download, downloadMany, loading };
}

import { useCallback } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
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
  return { download, loading };
}

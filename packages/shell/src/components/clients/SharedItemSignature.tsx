import { useT } from '@exyconn/i18n';
import { useSettings } from '@/hooks/useSettings';
import { ClientSharedKind } from '@/graphql/generated';

interface SharedItemSignatureProps {
  item: {
    kind: ClientSharedKind;
    signedAt?: string | null;
    signedBy?: string | null;
  };
}

/**
 * Whether the counterparty has signed a contract shared with a client — on Admin › Clients and
 * in the client hub alike. Renders nothing for documents and policies, which are not signed.
 */
export function SharedItemSignature({ item }: Readonly<SharedItemSignatureProps>) {
  const t = useT();
  const { formatDate } = useSettings();
  if (item.kind !== ClientSharedKind.Contract) {
    return null;
  }
  if (!item.signedAt) {
    return <>{t('Not signed yet')}</>;
  }
  return (
    <>
      {t('Signed by {name} on {date}', {
        name: item.signedBy ?? '',
        date: formatDate(item.signedAt),
      })}
    </>
  );
}

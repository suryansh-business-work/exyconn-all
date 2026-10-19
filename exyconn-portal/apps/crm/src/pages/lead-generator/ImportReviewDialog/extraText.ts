import type { useT } from '@exyconn/i18n';
import type { LeadImportExtra } from '../leadTypes';

type Translate = ReturnType<typeof useT>;

/** One detail a lead adds to an existing company, as a line the person can read. */
export function extraText(t: Translate, extra: LeadImportExtra): string {
  if (extra.field === 'emails') {
    return t('+ new email {email}', { email: extra.incoming });
  }
  if (extra.field === 'phones') {
    return t('+ new phone {phone}', { phone: extra.incoming });
  }
  return t('{field}: {current} → adds {incoming}', {
    field: t(extra.label),
    current: extra.current || t('empty'),
    incoming: extra.incoming,
  });
}

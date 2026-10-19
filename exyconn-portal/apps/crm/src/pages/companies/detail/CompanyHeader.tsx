import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Chip } from '@exyconn/shell/components/ui';
import type { CompanyFieldsFragment } from '@exyconn/shell/graphql/generated';
import { ProfileHeader, RecordAvatar, TruncatedLink } from '../../../records/detail';

interface CompanyHeaderProps {
  company: CompanyFieldsFragment;
  titleComponent?: 'h1' | 'h2';
  titleId?: string;
  action?: ReactNode;
}

/** The company's logo, name, domain and status — on its page and in the list's quick view. */
export function CompanyHeader({
  company,
  titleComponent,
  titleId,
  action,
}: Readonly<CompanyHeaderProps>) {
  const t = useT();
  return (
    <ProfileHeader
      avatar={
        <RecordAvatar
          name={company.name}
          src={company.logoUrl}
          domain={company.domain}
          variant="rounded"
          sx={{ width: 56, height: 56 }}
        />
      }
      name={company.name}
      titleComponent={titleComponent}
      titleId={titleId}
      subtitle={
        company.domain && <TruncatedLink href={`https://${company.domain}`} text={company.domain} />
      }
      chips={
        <>
          <Chip size="small" label={t(company.status)} />
          {company.isClient && <Chip size="small" color="success" label={t('Client')} />}
        </>
      }
      action={action}
    />
  );
}

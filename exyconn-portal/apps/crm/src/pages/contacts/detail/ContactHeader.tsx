import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Chip, Text } from '@exyconn/shell/components/ui';
import type { ContactFieldsFragment } from '@exyconn/shell/graphql/generated';
import { ProfileHeader, RecordAvatar } from '../../../records/detail';

interface ContactHeaderProps {
  contact: ContactFieldsFragment;
  titleComponent?: 'h1' | 'h2';
  titleId?: string;
  action?: ReactNode;
}

/** The person's picture, name, role and stage — on their page and in the list's quick view. */
export function ContactHeader({
  contact,
  titleComponent,
  titleId,
  action,
}: Readonly<ContactHeaderProps>) {
  const t = useT();
  const role = [contact.title, contact.companyName].filter(Boolean).join(' · ');
  return (
    <ProfileHeader
      avatar={
        <RecordAvatar name={contact.name} src={contact.avatarUrl} sx={{ width: 56, height: 56 }} />
      }
      name={contact.name}
      titleComponent={titleComponent}
      titleId={titleId}
      subtitle={
        role && (
          <Text size="sm" color="text.secondary">
            {role}
          </Text>
        )
      }
      chips={
        <>
          <Chip size="small" label={t(contact.lifecycleStage)} />
          <Chip size="small" variant="outlined" label={t(contact.status)} />
        </>
      }
      action={action}
    />
  );
}

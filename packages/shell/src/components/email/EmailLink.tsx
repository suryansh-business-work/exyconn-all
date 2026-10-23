import type { MouseEvent, ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Link } from '@/components/ui';
import { useEmailAction } from './EmailAction';

interface EmailLinkProps {
  /** The address to write to; nothing is drawn while it is blank. */
  address: string | null | undefined;
  /** What the link shows; the address itself by default. */
  children?: ReactNode;
  /** Replaces the default (or provided) action, e.g. one record's own compose. */
  onEmail?: (address: string) => void;
}

/**
 * An email address that opens the email window when clicked (or Enter/Space), anywhere in a
 * portal. A real button for keyboards and screen readers, styled as a link; the click does
 * not reach a clickable row or card around it.
 */
export function EmailLink({ address, children, onEmail }: Readonly<EmailLinkProps>) {
  const t = useT();
  const contextAction = useEmailAction();
  const value = address?.trim();
  if (!value) {
    return null;
  }
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    (onEmail ?? contextAction)(value);
  };
  return (
    <Link
      component="button"
      type="button"
      onClick={onClick}
      aria-label={t('Email {address}', { address: value })}
      sx={{
        font: 'inherit',
        textAlign: 'start',
        verticalAlign: 'baseline',
        overflowWrap: 'anywhere',
      }}
    >
      {children ?? value}
    </Link>
  );
}

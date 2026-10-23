import { createContext, useContext, type ReactNode } from 'react';
import { openEmailTo } from './openEmail';

/** What clicking an email address does; the default opens the person's own email window. */
export type EmailAction = (address: string) => void;

const EmailActionContext = createContext<EmailAction>(openEmailTo);

interface EmailActionProviderProps {
  /** E.g. the CRM's record-aware compose, so the email is kept on the record's timeline. */
  onEmail: EmailAction;
  children: ReactNode;
}

/** Changes what every {@link EmailLink} inside it does when clicked. */
export function EmailActionProvider({ onEmail, children }: Readonly<EmailActionProviderProps>) {
  return <EmailActionContext.Provider value={onEmail}>{children}</EmailActionContext.Provider>;
}

export const useEmailAction = () => useContext(EmailActionContext);

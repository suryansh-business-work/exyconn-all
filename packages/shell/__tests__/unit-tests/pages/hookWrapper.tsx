import type { ReactNode } from 'react';
import { MockedProvider } from '@apollo/client/testing/react';
import { I18nProvider } from '@exyconn/i18n';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';

interface HookWrapperProps {
  children: ReactNode;
}

/**
 * The providers a page hook leans on — Apollo, i18n, notifications and the confirm dialog —
 * for `renderHook`. The dialog and the snackbar render inside it, so `screen` reaches both.
 */
export function HookWrapper({ children }: Readonly<HookWrapperProps>) {
  return (
    <MockedProvider mocks={[]}>
      <I18nProvider locale="en" messages={{}}>
        <NotificationProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </NotificationProvider>
      </I18nProvider>
    </MockedProvider>
  );
}

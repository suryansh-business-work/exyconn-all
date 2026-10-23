import { openDockPanel, type DockBodyProps } from '@exyconn/shell/components/compose-dock';
import { ComposeEmailForm, type ComposeEmailContext } from '../detail/forms/compose-email';
import { CHANNELS } from './channels';

/** The compose form inside the dock window, keeping its draft across navigation. */
function ComposeDockBody({ panel, onClose }: Readonly<DockBodyProps>) {
  return (
    <ComposeEmailForm
      context={panel.data as ComposeEmailContext}
      memoryKey={panel.key}
      onDone={onClose}
      onCancel={onClose}
    />
  );
}

/**
 * Opens an email in the floating window at the bottom of the screen, like the record's Reach
 * out email: a new email from CRM > Mail, or one from a record's Emails tab. One window per
 * thread or set of recipients, so opening it again brings its draft back.
 */
export function openComposeEmail(context: ComposeEmailContext) {
  const to = context.to.join(', ');
  openDockPanel({
    key: ['compose', context.threadId ?? context.id, to].filter(Boolean).join(':'),
    title: CHANNELS.EMAIL.label,
    subject: to || undefined,
    icon: CHANNELS.EMAIL.icon,
    Body: ComposeDockBody,
    data: context,
  });
}

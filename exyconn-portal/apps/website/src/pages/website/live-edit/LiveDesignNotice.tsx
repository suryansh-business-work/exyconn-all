import { useFormContext } from 'react-hook-form';
import { Alert, Button, Text } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/**
 * Stands in for the body field when the body was designed in the live editor. Turning
 * it back into rich text drops the design's CSS (and, on the next rich-text save, the
 * layout markup), so it asks first; the change only sticks when the form is saved.
 */
export function LiveDesignNotice() {
  const { setValue } = useFormContext();
  const confirm = useConfirm();
  const notify = useNotify();

  const convert = async () => {
    const ok = await confirm({
      title: 'Edit as rich text?',
      message:
        'The live-editor design — columns, colours, spacing, callouts — will be removed. The text is kept.',
      confirmText: 'Remove design',
    });
    if (ok) {
      setValue('contentCss', '', { shouldDirty: true });
    }
  };

  return (
    <Alert
      severity="info"
      action={
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            convert().catch((error: unknown) =>
              notify(errorMessage(error, 'Could not switch editors'), 'error'),
            );
          }}
        >
          Edit as rich text
        </Button>
      }
    >
      <Text weight="semibold" component="div">
        Designed in the live editor
      </Text>
      This body has a custom layout. Change it with the Live edit action in the list, so the design
      is kept.
    </Alert>
  );
}

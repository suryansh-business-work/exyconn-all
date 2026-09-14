import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useTranslateEverythingMutation } from '@exyconn/shell/graphql/generated';

interface TranslateEverythingButtonProps {
  /** The language the screen is showing. */
  locale: string;
  /** Its name, for the confirmation — "Français", not "fr". */
  languageLabel: string;
  /** Reloads the list, so the first translations show without a manual refresh. */
  onStarted: () => void;
}

/**
 * Sends everything the portals and the website have ever shown into one language through the
 * model, at once, instead of waiting for people to browse each screen in it.
 *
 * Confirmed first: it is one click that spends real money on the OpenAI account, and the
 * person should know it runs in the background and that their own corrections are safe.
 */
export function TranslateEverythingButton({
  locale,
  languageLabel,
  onStarted,
}: Readonly<TranslateEverythingButtonProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [translateEverything, { loading }] = useTranslateEverythingMutation();

  const start = async () => {
    const ok = await confirm({
      title: 'Translate everything into {language}?',
      titleValues: { language: languageLabel },
      message:
        'Every English string the portals and the website have shown so far is sent to the AI model and translated in the background. It uses your OpenAI account. Corrections a person has made are never overwritten.',
      confirmText: 'Translate everything',
    });
    if (!ok) {
      return;
    }
    try {
      const { data } = await translateEverything({ variables: { locale } });
      const fill = data?.translateEverything;
      if (fill?.alreadyRunning) {
        notify('{language} is already being translated.', 'info', { language: languageLabel });
      } else if (fill && fill.queued > 0) {
        notify(
          'Translating {count} strings into {language}. They appear here as they finish.',
          'success',
          { count: fill.queued, language: languageLabel },
        );
      } else {
        notify('Everything is already translated into {language}.', 'info', {
          language: languageLabel,
        });
      }
      onStarted();
    } catch (error) {
      notify(errorMessage(error, 'Could not start the translation'), 'error');
    }
  };

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<AutoAwesomeIcon fontSize="small" />}
      onClick={start}
      disabled={loading || locale === ''}
    >
      {t('Translate everything with AI')}
    </Button>
  );
}

import { useState } from 'react';
import { Button, Flex, TextField } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSetTranslationMutation } from '@exyconn/shell/graphql/generated';

interface Props {
  locale: string;
  source: string;
  text: string;
  onSaved: () => void;
}

/**
 * One row's translation, correctable in place.
 *
 * Editing here marks the row as a human's, which is what stops the machine ever writing
 * over it again — the whole point of a review screen is that a correction sticks.
 */
export function TranslationEditor({ locale, source, text, onSaved }: Readonly<Props>) {
  const notify = useNotify();
  const [value, setValue] = useState(text);
  const [saving, setSaving] = useState(false);
  const [setTranslation] = useSetTranslationMutation();

  const save = async () => {
    setSaving(true);
    try {
      await setTranslation({ variables: { locale, source, text: value } });
      notify('Translation saved');
      onSaved();
    } catch (err) {
      notify(errorMessage(err, 'Could not save the translation'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex direction="row" gap={1} alignItems="center">
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(event) => setValue(event.target.value)}
        slotProps={{
          htmlInput: { 'aria-label': `Translation of "${source}"` },
        }}
      />
      <Button
        size="small"
        variant="outlined"
        disabled={saving || value.trim() === '' || value === text}
        onClick={() => void save()}
      >
        Save
      </Button>
    </Flex>
  );
}

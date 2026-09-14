import { useFieldArray, useFormContext } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useT } from '@exyconn/i18n';
import { Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfDatePicker, RhfSwitch } from '@exyconn/shell/components/form/rhf';

/**
 * What the meeting decided somebody would go and do.
 *
 * Kept on the minute rather than filed as findings: these are decisions of the review, and a
 * review whose actions lived somewhere else could not be read as the record clause 9.3 asks
 * for. Whether each has been done is what the next review opens on.
 */
export function ReviewActionFields() {
  const t = useT();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'actions' });

  return (
    <Flex direction="column" spacing={1}>
      <Text size="sm" weight="bold">
        {t('Actions')}
      </Text>
      <Text size="caption" color="text.secondary">
        {t(
          'What leadership decided to do, who owns it and by when. The next review opens on whatever is still outstanding here.',
        )}
      </Text>

      {fields.map((field, index) => (
        <Flex key={field.id} direction="row" spacing={1} alignItems="flex-start">
          <RhfTextField name={`actions.${index}.description`} label="Action" />
          <RhfTextField name={`actions.${index}.ownerName`} label="Owner" />
          <RhfDatePicker name={`actions.${index}.dueOn`} label="Due" />
          <RhfSwitch name={`actions.${index}.done`} label="Done" />
          <IconButton
            aria-label={t('Remove action {number}', { number: index + 1 })}
            onClick={() => remove(index)}
            sx={{ mt: 1 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Flex>
      ))}

      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => append({ description: '', ownerName: '', dueOn: null, done: false })}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Add action')}
      </Button>
    </Flex>
  );
}

import { useFieldArray, useFormContext } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'actions' });

  return (
    <Flex direction="column" spacing={1}>
      <Text size="sm" weight="bold">
        Actions
      </Text>
      <Text size="caption" color="text.secondary">
        What leadership decided to do, who owns it and by when. The next review opens on whatever is
        still outstanding here.
      </Text>

      {fields.map((field, index) => (
        <Flex key={field.id} direction="row" spacing={1} alignItems="flex-start">
          <RhfTextField name={`actions.${index}.description`} label="Action" />
          <RhfTextField name={`actions.${index}.ownerName`} label="Owner" />
          <RhfDatePicker name={`actions.${index}.dueOn`} label="Due" />
          <RhfSwitch name={`actions.${index}.done`} label="Done" />
          <IconButton
            aria-label={`Remove action ${index + 1}`}
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
        Add action
      </Button>
    </Flex>
  );
}

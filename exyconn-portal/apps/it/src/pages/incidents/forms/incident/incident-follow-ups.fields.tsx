import { useFieldArray, useFormContext } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useT } from '@exyconn/i18n';
import { Box, Button, Grid, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfDatePicker, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import type { FollowUpValues } from './incident.types';

const EMPTY_FOLLOW_UP: FollowUpValues = { title: '', ownerName: '', dueAt: '', done: false };

/** One post-incident action. Hoisted to module scope — never defined inside its parent. */
function FollowUpRow({ index, onRemove }: Readonly<{ index: number; onRemove: () => void }>) {
  const t = useT();
  return (
    <Grid container spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <RhfTextField name={`followUps.${index}.title`} label="Action" />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <RhfTextField name={`followUps.${index}.ownerName`} label="Owner" />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <RhfDatePicker name={`followUps.${index}.dueAt`} label="Due" />
      </Grid>
      <Grid size={{ xs: 8, sm: 1 }}>
        <RhfSwitch name={`followUps.${index}.done`} label="Done" />
      </Grid>
      <Grid size={{ xs: 4, sm: 1 }}>
        <IconButton aria-label={t('Remove action')} onClick={onRemove} size="small">
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Grid>
    </Grid>
  );
}

/** What the post-incident review decided must happen so it does not happen again. */
export function IncidentFollowUpsFields() {
  const t = useT();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'followUps' });
  return (
    <Box>
      <Text size="sm" weight="bold" sx={{ display: 'block', mb: 1 }}>
        {t('Post-incident actions')}
      </Text>
      {fields.map((field, index) => (
        <FollowUpRow key={field.id} index={index} onRemove={() => remove(index)} />
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => append({ ...EMPTY_FOLLOW_UP })}>
        {t('Add action')}
      </Button>
    </Box>
  );
}

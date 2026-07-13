import { useFieldArray, useFormContext } from 'react-hook-form';
import { Box, Button, Flex, IconButton, Stack, Typography } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const EMPTY_BENEFIT = { icon: '', title: '', description: '' };

/**
 * `useFieldArray`-backed editor for a company's `benefits` — an array of
 * `{ icon, title, description }` objects. Reads the surrounding FormProvider
 * context, so it must render inside the JobCompanyForm.
 */
export function CompanyBenefitsFields() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'benefits' });

  return (
    <Flex direction="column" spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Benefits</Typography>
        <Button
          type="button"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => append({ ...EMPTY_BENEFIT })}
        >
          Add benefit
        </Button>
      </Stack>

      {fields.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No benefits added yet.
        </Typography>
      )}

      {fields.map((field, index) => (
        <Box key={field.id} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Flex direction="column" spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Benefit {index + 1}
              </Typography>
              <IconButton
                size="small"
                color="error"
                aria-label={`Remove benefit ${index + 1}`}
                onClick={() => remove(index)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
            <RhfTextField name={`benefits.${index}.icon`} label="Icon" />
            <RhfTextField name={`benefits.${index}.title`} label="Title" />
            <RhfTextField
              name={`benefits.${index}.description`}
              label="Description"
              multiline
              minRows={2}
            />
          </Flex>
        </Box>
      ))}
    </Flex>
  );
}

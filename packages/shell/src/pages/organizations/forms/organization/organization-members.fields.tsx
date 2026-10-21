import { useFieldArray, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import AddIcon from '@mui/icons-material/PersonAddAlt1';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, Button, Flex, IconButton, Text, Tooltip } from '@/components/ui';
import { RhfMultiSelect, RhfTextField } from '@/components/form/rhf';
import { Role } from '@/graphql/generated';
import type { OrganizationValues } from './organization.schema';
import { PORTAL_OPTIONS } from './organization.options';

/**
 * People to invite once the company is created, each with the portals they may open. Every
 * one gets the welcome email with a temporary password; Admin › Users manages them after.
 */
export function OrganizationMembersFields() {
  const t = useT();
  const { control } = useFormContext<OrganizationValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'members' });
  return (
    <Flex direction="column" spacing={1.5}>
      <Box>
        <Text weight="semibold">{t('Invite people')}</Text>
        <Text size="sm" color="text.secondary">
          {t(
            'Optional. Give people access now, by the portals they need. More can be added later in Admin › Users.',
          )}
        </Text>
      </Box>
      {fields.map((field, index) => (
        <Box
          key={field.id}
          sx={{
            display: 'grid',
            gap: 1.5,
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr auto' },
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <RhfTextField
            name={`members.${index}.name`}
            label="Name"
            required
            helperText="Their full name."
          />
          <RhfTextField
            name={`members.${index}.email`}
            label="Email"
            type="email"
            required
            helperText="The address they will sign in with."
          />
          <RhfMultiSelect
            name={`members.${index}.roles`}
            label="Portals"
            options={PORTAL_OPTIONS}
            helperText="Each portal they may open."
          />
          <Tooltip title={t('Remove this person')}>
            <IconButton
              aria-label={t('Remove this person')}
              onClick={() => remove(index)}
              sx={{ mt: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
      <Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => append({ name: '', email: '', roles: [Role.Employee] })}
        >
          {t('Add a person')}
        </Button>
      </Box>
    </Flex>
  );
}

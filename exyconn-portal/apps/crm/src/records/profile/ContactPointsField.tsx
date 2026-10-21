import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useT } from '@exyconn/i18n';
import { Button, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { RhfFieldArrayError, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { POINT_LABELS } from './profile.schema';

const LABEL_OPTIONS = POINT_LABELS.map((label) => ({ value: label, label }));

type ListName = 'emails' | 'phones';
type ValueKey = 'address' | 'number';

/** What each kind of value looks like, shown under its input. */
const VALUE_HINTS: Record<ValueKey, string> = {
  address: 'An address they read, e.g. priya@acme.com.',
  number: 'In international format, e.g. +14155550100.',
};

interface PointRowProps {
  name: ListName;
  valueKey: ValueKey;
  inputLabel: string;
  index: number;
  onMakePrimary: (index: number) => void;
  onRemove: (index: number) => void;
}

/** One address or number: the value, what it is called, whether it is the one to use. */
function PointRow({
  name,
  valueKey,
  inputLabel,
  index,
  onMakePrimary,
  onRemove,
}: Readonly<PointRowProps>) {
  const t = useT();
  const { control } = useFormContext();
  const primary = useWatch({ control, name: `${name}.${index}.primary` }) === true;
  const number = index + 1;
  const primaryLabel = primary ? t('Primary') : t('Make primary');
  return (
    <Flex direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
      <RhfTextField
        name={`${name}.${index}.${valueKey}`}
        label={inputLabel}
        size="small"
        helperText={VALUE_HINTS[valueKey]}
      />
      <RhfSelect
        name={`${name}.${index}.label`}
        label="Label"
        options={LABEL_OPTIONS}
        helperText="What kind it is, e.g. Work or Mobile."
      />
      <Flex direction="row" spacing={0.5}>
        <Tooltip title={primaryLabel}>
          <IconButton
            size="small"
            color={primary ? 'warning' : 'default'}
            aria-label={t('{label} {number}', { label: primaryLabel, number })}
            aria-pressed={primary}
            onClick={() => onMakePrimary(index)}
          >
            {primary ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <IconButton
          size="small"
          color="error"
          aria-label={t('Remove {label} {number}', { label: inputLabel, number })}
          onClick={() => onRemove(index)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Flex>
    </Flex>
  );
}

interface ContactPointsFieldProps {
  name: ListName;
  title: string;
  inputLabel: string;
  addLabel: string;
}

/**
 * A labelled list of email addresses or phone numbers with one primary (the star). The server
 * keeps the primary in the record's single email / phone field.
 */
export function ContactPointsField({
  name,
  title,
  inputLabel,
  addLabel,
}: Readonly<ContactPointsFieldProps>) {
  const t = useT();
  const { control, getValues, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const valueKey: ValueKey = name === 'emails' ? 'address' : 'number';

  const makePrimary = (chosen: number) => {
    fields.forEach((_field, index) =>
      setValue(`${name}.${index}.primary`, index === chosen, { shouldDirty: true }),
    );
  };
  const add = () => {
    const first = (getValues(name) as unknown[]).length === 0;
    append({ [valueKey]: '', label: POINT_LABELS[0], primary: first });
  };

  return (
    <Flex direction="column" spacing={1}>
      <Text component="h3" size="label" weight="bold">
        {t(title)}
      </Text>
      {fields.map((field, index) => (
        <PointRow
          key={field.id}
          name={name}
          valueKey={valueKey}
          inputLabel={inputLabel}
          index={index}
          onMakePrimary={makePrimary}
          onRemove={remove}
        />
      ))}
      <RhfFieldArrayError name={name} />
      <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ alignSelf: 'flex-start' }}>
        {t(addLabel)}
      </Button>
    </Flex>
  );
}

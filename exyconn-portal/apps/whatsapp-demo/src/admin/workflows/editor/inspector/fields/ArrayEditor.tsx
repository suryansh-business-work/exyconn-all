import { useId, type ComponentType } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { RhfFieldArrayError } from '@exyconn/shell/components/form/rhf';
import { Box, Button, Flex, IconButton, Paper, Text, Tooltip } from '@exyconn/shell/components/ui';

/** What each row of an {@link ArrayEditor} is given: its own path inside the form. */
export interface ArrayItemProps {
  /** e.g. `buttons.1` — fields inside use `${name}.title`. */
  name: string;
  index: number;
}

interface ArrayEditorProps {
  name: string;
  /** English source for the section heading, e.g. "Buttons". */
  title: string;
  /** English source naming one item, e.g. "Button" → "Button 2". */
  itemLabel: string;
  Item: ComponentType<Readonly<ArrayItemProps>>;
  /** A new item; given the current items so its id can be unique (see `nextId`). */
  newItem: (items: readonly Record<string, unknown>[]) => Record<string, unknown>;
  min?: number;
  max?: number;
}

/**
 * A titled list of repeated items (buttons, rows, cards, cases…) with add and remove, the
 * WhatsApp limit shown as `n/max`, and the array's own error ("Add at least one").
 */
export function ArrayEditor({
  name,
  title,
  itemLabel,
  Item,
  newItem,
  min = 0,
  max,
}: Readonly<ArrayEditorProps>) {
  const t = useT();
  const headingId = useId();
  const { control, getValues } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const full = max !== undefined && fields.length >= max;
  const count = max === undefined ? String(fields.length) : `${fields.length}/${max}`;

  return (
    <Box role="group" aria-labelledby={headingId} sx={{ minWidth: 0 }}>
      <Flex alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Text id={headingId} size="label" weight="semibold">
          {t(title)}{' '}
          <Text size="caption" color="text.secondary">
            ({count})
          </Text>
        </Text>
        <Button
          size="small"
          startIcon={<AddIcon />}
          disabled={full}
          onClick={() => append(newItem(getValues(name) ?? []))}
        >
          {t('Add')}
        </Button>
      </Flex>
      <Flex direction="column" spacing={1.5}>
        {fields.map((field, index) => (
          <Paper key={field.id} variant="outlined" sx={{ p: 1.5 }}>
            <Flex alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Text size="caption" weight="medium" color="text.secondary">
                {t('{item} {number}', { item: t(itemLabel), number: index + 1 })}
              </Text>
              <Tooltip title={t('Remove')}>
                <span>
                  <IconButton
                    size="small"
                    aria-label={t('Remove {item} {number}', {
                      item: t(itemLabel),
                      number: index + 1,
                    })}
                    disabled={fields.length <= min}
                    onClick={() => remove(index)}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Flex>
            <Flex direction="column" spacing={1.5}>
              <Item name={`${name}.${index}`} index={index} />
            </Flex>
          </Paper>
        ))}
      </Flex>
      <RhfFieldArrayError name={name} />
    </Box>
  );
}

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { fromTree, toTree, type PropNode } from './props-tree';
import {
  propsFormSchema,
  type PropsEditMode,
  type PropsFormValues,
} from './cms-component-props.types';
import { PropField } from './PropField';
import { PropObjectGroup } from './PropObjectGroup';

interface ComponentPropsFormProps {
  props: Record<string, unknown>;
  siteId: string;
  onApply: (props: Record<string, unknown>) => void;
  onCancel: () => void;
}

const stringify = (value: unknown) => JSON.stringify(value, null, 2);

/**
 * React Hook Form + Zod form for a dynamic component's props, generated from the value
 * itself: text, numbers, switches, lists and groups — or the raw JSON, checked before it is
 * applied. Switching views carries the edits across.
 */
export function ComponentPropsForm({
  props,
  siteId,
  onApply,
  onCancel,
}: Readonly<ComponentPropsFormProps>) {
  const t = useT();
  const methods = useForm<PropsFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(propsFormSchema),
    defaultValues: { mode: 'fields', tree: toTree(props), json: stringify(props) },
  });
  const { control, getValues, setValue, setError } = methods;
  const mode = useWatch({ control, name: 'mode' });

  const switchTo = (next: PropsEditMode | null) => {
    if (!next || next === mode) return;
    if (next === 'json') {
      setValue('json', stringify(fromTree(getValues('tree'))));
      setValue('mode', 'json');
      return;
    }
    try {
      const parsed: unknown = JSON.parse(getValues('json'));
      setValue('tree', toTree(parsed));
      setValue('mode', 'fields');
    } catch {
      setError('json', { message: 'Fix the JSON before switching to the fields view' });
    }
  };

  const onSubmit = (values: PropsFormValues) => {
    const next = values.mode === 'fields' ? fromTree(values.tree) : JSON.parse(values.json);
    onApply(next as Record<string, unknown>);
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Apply"
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={mode}
        onChange={(_event, next: PropsEditMode | null) => switchTo(next)}
        aria-label={t('How to edit the settings')}
      >
        <ToggleButton value="fields">{t('Fields')}</ToggleButton>
        <ToggleButton value="json">{t('JSON')}</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'fields' ? (
        <Controller
          name="tree"
          control={control}
          render={({ field }) => (
            <PropObjectGroup
              flat
              label=""
              node={field.value as Extract<PropNode, { kind: 'object' }>}
              siteId={siteId}
              onChange={field.onChange}
              Field={PropField}
            />
          )}
        />
      ) : (
        <RhfTextField
          name="json"
          label="Settings (JSON)"
          multiline
          minRows={16}
          slotProps={{
            htmlInput: { style: { fontFamily: 'monospace', fontSize: 13 }, spellCheck: false },
          }}
          helperText="Every value the component renders. Must be a JSON object."
        />
      )}
    </EntityForm>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { CommonFields } from './CommonFields';
import { compact, hasChanges, nodeResolver, toFormValues } from './node-form-data';

interface NodeFormFrameProps<D> {
  /** The node type's data schema — `NODE_SCHEMAS[type].shape.data`. */
  schema: z.ZodType<D>;
  data: D;
  onApply: (data: D) => void;
  children: ReactNode;
}

/**
 * The frame every inspector form shares: React Hook Form validated by the node's own Zod
 * schema, the type's fields as children, the fields every node has, and Apply / Reset.
 * Apply hands the cleaned data to the canvas; nothing is saved until Save draft.
 */
export function NodeFormFrame<D>({
  schema,
  data,
  onApply,
  children,
}: Readonly<NodeFormFrameProps<D>>) {
  const t = useT();
  const resolver = useMemo(() => nodeResolver(schema), [schema]);
  // What the form is measured against: the node's data, then whatever was last applied.
  const [baseline, setBaseline] = useState(() => toFormValues(data));
  const methods = useForm({ mode: 'onTouched', resolver, defaultValues: baseline });
  const values = useWatch({ control: methods.control });
  const isDirty = hasChanges(values, baseline);
  const { isSubmitting } = methods.formState;

  const submit = methods.handleSubmit((submitted) => {
    const next = compact(submitted) as D;
    const applied = toFormValues(next);
    onApply(next);
    setBaseline(applied);
    methods.reset(applied);
  });

  return (
    <FormProvider {...methods}>
      <Box component="form" noValidate onSubmit={submit}>
        <Flex direction="column" spacing={2}>
          {children}
          <CommonFields />
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              py: 1.5,
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            {isDirty && (
              <Text
                size="caption"
                color="text.secondary"
                component="p"
                sx={{ mb: 1 }}
                role="status"
              >
                {t('Apply to update the canvas. Save draft keeps it.')}
              </Text>
            )}
            <Flex direction="row" spacing={1} justifyContent="flex-end">
              <Button color="inherit" disabled={!isDirty} onClick={() => methods.reset(baseline)}>
                {t('Reset')}
              </Button>
              <Button type="submit" variant="contained" disabled={!isDirty} loading={isSubmitting}>
                {t('Apply')}
              </Button>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </FormProvider>
  );
}

import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import AddIcon from '@mui/icons-material/Add';
import {
  Button,
  Divider,
  Flex,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@exyconn/shell/components/ui';
import { AudienceRuleCombinator, AudienceRuleOperator } from '@exyconn/shell/graphql/generated';
import { BuilderSection } from './BuilderSection';
import { AudienceConditionRow } from './AudienceConditionRow';
import type { FilterFieldEntry } from './AudienceConditionValue';
import { MAX_CONDITIONS, newConditionKey, type AudienceFormValues } from './audience-list.types';

interface AudienceRulesSectionProps {
  fields: readonly FilterFieldEntry[];
  /** True while the field catalogue is still loading. */
  loading: boolean;
}

/** The combinator as a small AND / OR switch beside the heading. */
function CombinatorToggle() {
  const t = useT();
  const { control } = useFormContext<AudienceFormValues>();
  return (
    <Controller
      name="ruleCombinator"
      control={control}
      render={({ field }) => (
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          aria-label={t('Match')}
          value={field.value}
          onChange={(_event, value: AudienceRuleCombinator | null) =>
            value && field.onChange(value)
          }
        >
          <ToggleButton value={AudienceRuleCombinator.And}>{t('All (AND)')}</ToggleButton>
          <ToggleButton value={AudienceRuleCombinator.Or}>{t('Any (OR)')}</ToggleButton>
        </ToggleButtonGroup>
      )}
    />
  );
}

/** Advanced filters: conditions on contacts, companies, activity and email status. */
export function AudienceRulesSection({ fields, loading }: Readonly<AudienceRulesSectionProps>) {
  const t = useT();
  const { control } = useFormContext<AudienceFormValues>();
  const {
    fields: rows,
    append,
    remove,
  } = useFieldArray({ control, name: 'conditions', keyName: 'rowId' });
  const combinator = useWatch({ control, name: 'ruleCombinator' });
  const joiner = t(combinator === AudienceRuleCombinator.Or ? 'OR' : 'AND');
  const addCondition = () =>
    append({ key: newConditionKey(), field: '', operator: AudienceRuleOperator.Equals, value: '' });

  return (
    <BuilderSection
      title="Advanced filters"
      hint="Build conditions using AND/OR. Matching recipients are recalculated automatically. Email status conditions are checked for each address on its own."
      aside={<CombinatorToggle />}
    >
      {rows.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('No conditions: every record in the chosen source matches.')}
        </Text>
      )}
      {rows.map((row, index) => (
        <Flex key={row.key} direction="column" spacing={1}>
          {index > 0 && <Divider>{joiner}</Divider>}
          <AudienceConditionRow index={index} fields={fields} onRemove={() => remove(index)} />
        </Flex>
      ))}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addCondition}
        disabled={loading || rows.length >= MAX_CONDITIONS}
      >
        {t('Add condition')}
      </Button>
    </BuilderSection>
  );
}

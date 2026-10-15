import { Fragment, useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { Chip, Flex, Text } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { FilterGroup } from '../list/recordQuery';
import type { CrmPropertyInfo } from '../schema';
import { describeCondition, type DescribeTools } from './describeCondition';

interface ActiveFilterChipsProps {
  properties: readonly CrmPropertyInfo[];
  groups: readonly FilterGroup[];
  onRemove: (conditionId: string) => void;
}

/** The applied filters as removable chips under the toolbar; groups are separated by "or". */
export function ActiveFilterChips({
  properties,
  groups,
  onRemove,
}: Readonly<ActiveFilterChipsProps>) {
  const t = useT();
  const { formatDate, formatNumber, formatList } = useSettings();
  const tools = useMemo<DescribeTools>(
    () => ({
      t,
      formatList,
      formatters: { formatDate, formatNumber, yes: t('Yes'), no: t('No') },
    }),
    [t, formatDate, formatNumber, formatList],
  );
  const byKey = useMemo(() => new Map(properties.map((p) => [p.key, p])), [properties]);
  if (groups.length === 0) {
    return null;
  }
  return (
    <Flex
      direction="row"
      wrap
      spacing={1}
      alignItems="center"
      role="group"
      aria-label={t('Active filters')}
    >
      {groups.map((group, index) => (
        <Fragment key={group.id}>
          {index > 0 && (
            <Text size="caption" color="text.secondary" weight="semibold">
              {t('or')}
            </Text>
          )}
          {group.conditions.map((condition) => {
            const label = describeCondition(condition, byKey.get(condition.property), tools);
            return (
              <Chip
                key={condition.id}
                size="small"
                label={label}
                onDelete={() => onRemove(condition.id)}
              />
            );
          })}
        </Fragment>
      ))}
    </Flex>
  );
}

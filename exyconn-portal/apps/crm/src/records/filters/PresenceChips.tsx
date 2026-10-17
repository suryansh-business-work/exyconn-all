import { useMemo } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { useT } from '@exyconn/i18n';
import { Chip } from '@exyconn/shell/components/ui';
import type { FilterGroup } from '../list/recordQuery';
import { propertyLabel } from '../propertyText';
import type { CrmPropertyInfo } from '../schema';
import { hasPresence, presenceProperties, withPresence } from './presence';

interface PresenceChipsProps {
  properties: readonly CrmPropertyInfo[];
  groups: readonly FilterGroup[];
  onApply: (groups: FilterGroup[]) => void;
}

/**
 * One toggle chip per filter-only Yes/No check the record type has ("Has email", "Has phone").
 * On, the check is required in every filter group; off, it is taken out of all of them.
 */
export function PresenceChips({ properties, groups, onApply }: Readonly<PresenceChipsProps>) {
  const t = useT();
  const toggles = useMemo(() => presenceProperties(properties), [properties]);
  return toggles.map((property) => {
    const on = hasPresence(groups, property.key);
    return (
      <Chip
        key={property.key}
        size="small"
        label={propertyLabel(t, property)}
        icon={on ? <CheckIcon /> : undefined}
        color={on ? 'primary' : 'default'}
        variant={on ? 'filled' : 'outlined'}
        aria-pressed={on}
        onClick={() => onApply(withPresence(groups, property.key, !on))}
      />
    );
  });
}

import { Chip } from '@exyconn/shell/components/ui';
import type { StatusState } from '@exyconn/shell/graphql/generated';
import { STATE_META } from '../../status.constants';

interface StateChipProps {
  state: StatusState;
  size?: 'small' | 'medium';
}

/** The one place a state turns into a coloured label. */
export function StateChip({ state, size = 'small' }: Readonly<StateChipProps>) {
  const { label, tone, icon: Icon } = STATE_META[state];
  return <Chip size={size} color={tone} variant="outlined" icon={<Icon />} label={label} />;
}

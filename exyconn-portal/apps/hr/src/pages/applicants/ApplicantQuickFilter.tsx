import { ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import {
  FilterOp,
  type ApplicantStage,
  type TableFilterInput,
} from '@exyconn/shell/graphql/generated';
import { STAGE_OPTIONS } from './applicants.constants';

/** "all", or one stage of the pipeline. */
export type StageFilter = 'all' | ApplicantStage;

const OPTIONS = [{ value: 'all', label: 'All' }, ...STAGE_OPTIONS];

/** The server-side filter one quick-filter choice adds to every page request. */
export function stageFilters(filter: StageFilter): TableFilterInput[] {
  if (filter === 'all') {
    return [];
  }
  return [{ field: 'stage', op: FilterOp.Equals, value: filter }];
}

interface ApplicantQuickFilterProps {
  value: StageFilter;
  onChange: (next: StageFilter) => void;
}

/** One-click views of the pipeline, above the grid. */
export function ApplicantQuickFilter({ value, onChange }: Readonly<ApplicantQuickFilterProps>) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_event, next: StageFilter | null) => {
        if (next) {
          onChange(next);
        }
      }}
      aria-label="Stage filter"
      sx={{ mb: 1.5, flexWrap: 'wrap' }}
    >
      {OPTIONS.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

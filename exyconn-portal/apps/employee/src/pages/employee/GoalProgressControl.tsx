import { MenuItem, TextField } from '@exyconn/shell/components/ui';

const STEPS = [0, 25, 50, 75, 100];

interface GoalProgressControlProps {
  progress: number;
  disabled: boolean;
  onChange: (progress: number) => void;
}

/** Quarter-step progress picker — enough granularity without a free-text field. */
export function GoalProgressControl({
  progress,
  disabled,
  onChange,
}: Readonly<GoalProgressControlProps>) {
  return (
    <TextField
      select
      size="small"
      value={progress}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      sx={{ minWidth: 96 }}
      inputProps={{ 'aria-label': 'Goal progress' }}
    >
      {STEPS.map((step) => (
        <MenuItem key={step} value={step}>
          {step}%
        </MenuItem>
      ))}
    </TextField>
  );
}

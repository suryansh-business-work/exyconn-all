import { useT } from '@exyconn/i18n';
import { Step, StepButton, Stepper, useMediaQuery, useTheme } from '@exyconn/shell/components/ui';
import { STUDIO_STEPS, type StudioStep } from '../campaign.types';

interface StudioStepperProps {
  step: StudioStep;
  /** Steps a person may jump to: those already reached. */
  reachable: number;
  onSelect: (step: StudioStep) => void;
}

/** The six steps across the top; vertical-free and label-only on a phone. */
export function StudioStepper({ step, reachable, onSelect }: Readonly<StudioStepperProps>) {
  const t = useT();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const active = STUDIO_STEPS.findIndex((entry) => entry.slug === step);
  return (
    <Stepper
      nonLinear
      activeStep={active}
      alternativeLabel={!compact}
      aria-label={t('Campaign steps')}
      sx={{ overflowX: 'auto', py: 1 }}
    >
      {STUDIO_STEPS.map((entry, index) => (
        <Step key={entry.slug} completed={index < active}>
          <StepButton
            onClick={() => onSelect(entry.slug)}
            disabled={index > reachable}
            aria-current={index === active ? 'step' : undefined}
          >
            {compact && index !== active ? '' : t(entry.label)}
          </StepButton>
        </Step>
      ))}
    </Stepper>
  );
}

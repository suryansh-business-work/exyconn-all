import { useT } from '@exyconn/i18n';
import { Box, Button, Stack, Text } from '@exyconn/shell/components/ui';

interface TimeColumnProps {
  title: string;
  slots: string[];
  selected: string | null;
  label: (slot: string) => string;
  onSelect: (slot: string) => void;
  onNext: (slot: string) => void;
}

/** The picked day's free times; choosing one shows "Next" beside it. */
export function TimeColumn({
  title,
  slots,
  selected,
  label,
  onSelect,
  onNext,
}: Readonly<TimeColumnProps>) {
  const t = useT();
  return (
    <Stack spacing={1.5} sx={{ minWidth: { md: 220 } }}>
      <Text weight="semibold">{title}</Text>
      {slots.length === 0 && <Text color="text.secondary">{t('No free times that day.')}</Text>}
      <Stack
        spacing={1}
        role="group"
        aria-label={t('Free times')}
        sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}
      >
        {slots.map((slot) =>
          slot === selected ? (
            <Box key={slot} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Button variant="contained" color="inherit" aria-pressed>
                {label(slot)}
              </Button>
              <Button variant="contained" onClick={() => onNext(slot)}>
                {t('Next')}
              </Button>
            </Box>
          ) : (
            <Button key={slot} variant="outlined" onClick={() => onSelect(slot)} sx={{ py: 1 }}>
              {label(slot)}
            </Button>
          ),
        )}
      </Stack>
    </Stack>
  );
}

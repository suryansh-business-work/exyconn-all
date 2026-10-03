import { useT } from '@exyconn/i18n';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import { Button, Flex, MenuItem, TextField } from '@exyconn/shell/components/ui';
import type { DemoRow } from '../model/api';

interface DemoPickerProps {
  demos: readonly DemoRow[];
  value: string;
  onChange: (demoId: string) => void;
  onEditProfile: () => void;
  onNewDemo: () => void;
}

/** Which industry demo's workflows are listed, with its profile and a new demo one tap away. */
export function DemoPicker({
  demos,
  value,
  onChange,
  onEditProfile,
  onNewDemo,
}: Readonly<DemoPickerProps>) {
  const t = useT();
  return (
    <Flex direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }}>
      <TextField
        select
        size="small"
        label={t('Demo')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{ minWidth: { sm: 280 } }}
      >
        {demos.map((demo) => (
          <MenuItem key={demo.id} value={demo.id}>
            {t('{industry} — {business}', {
              industry: demo.industry,
              business: (demo.business as { name?: string }).name ?? demo.key,
            })}
          </MenuItem>
        ))}
      </TextField>
      <Button startIcon={<TuneIcon />} onClick={onEditProfile} disabled={!value}>
        {t('Business profile')}
      </Button>
      <Button startIcon={<AddIcon />} onClick={onNewDemo}>
        {t('New demo')}
      </Button>
    </Flex>
  );
}

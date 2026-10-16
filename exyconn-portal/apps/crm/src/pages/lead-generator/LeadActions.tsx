import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { useT } from '@exyconn/i18n';
import { Button, Checkbox, Flex, FormControlLabel } from '@exyconn/shell/components/ui';

interface LeadActionsProps {
  total: number;
  selected: number;
  findingEmails: boolean;
  importing: boolean;
  onToggleAll: () => void;
  onFindEmails: () => void;
  onImport: () => void;
}

/** Select all, read the chosen websites for emails, and file the chosen ones in the CRM. */
export function LeadActions({
  total,
  selected,
  findingEmails,
  importing,
  onToggleAll,
  onFindEmails,
  onImport,
}: Readonly<LeadActionsProps>) {
  const t = useT();
  const none = selected === 0;
  return (
    <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <FormControlLabel
        label={t('{selected} of {total} selected', { selected, total })}
        control={
          <Checkbox
            checked={selected > 0 && selected === total}
            indeterminate={selected > 0 && selected < total}
            onChange={onToggleAll}
          />
        }
      />
      <Button
        variant="outlined"
        startIcon={<MarkEmailReadIcon />}
        disabled={none || findingEmails}
        onClick={onFindEmails}
      >
        {findingEmails ? t('Reading websites…') : t('Find emails')}
      </Button>
      <Button
        variant="contained"
        startIcon={<AddBusinessIcon />}
        disabled={none || importing}
        onClick={onImport}
      >
        {importing ? t('Adding…') : t('Add {count} to CRM', { count: selected })}
      </Button>
    </Flex>
  );
}

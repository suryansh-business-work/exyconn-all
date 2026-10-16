import { useT } from '@exyconn/i18n';
import { Autocomplete, Chip, TextField } from '@exyconn/shell/components/ui';
import type { Account } from '../useSocialAccounts';
import { accountLabel } from '../social.labels';
import { SkeletonBone, SkeletonStatus } from '@exyconn/shell/components/feedback/skeletons';

interface AccountFilterProps {
  accounts: readonly Account[];
  selected: readonly string[];
  /** The accounts have not arrived yet. */
  loading: boolean;
  onChange: (ids: string[]) => void;
}

/** Which connected accounts the calendar shows; none chosen shows them all. */
export function AccountFilter({
  accounts,
  selected,
  loading,
  onChange,
}: Readonly<AccountFilterProps>) {
  const t = useT();
  if (loading) {
    return (
      <SkeletonStatus label="Loading accounts">
        <SkeletonBone variant="rounded" sx={{ width: { xs: '100%', sm: 320 }, height: 40 }} />
      </SkeletonStatus>
    );
  }
  const chosen = new Set(selected);
  const value = accounts.filter((account) => chosen.has(account.id));
  return (
    <Autocomplete
      multiple
      options={[...accounts]}
      value={value}
      getOptionLabel={accountLabel}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      onChange={(_event, next) => onChange(next.map((account) => account.id))}
      renderValue={(items, getItemProps) =>
        items.map((account, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip key={key} label={accountLabel(account)} size="small" {...itemProps} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('Accounts')}
          placeholder={value.length > 0 ? undefined : t('All accounts')}
        />
      )}
      sx={{ minWidth: 260, maxWidth: 640, flexGrow: 1 }}
    />
  );
}

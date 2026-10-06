import { useLocation, useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';
import { switchSitePath } from './site-paths';
import { useCurrentSite } from './site.context';

/** Picks the website the pages work on; the choice is the site segment of the URL. */
export function SiteSwitcher() {
  const t = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { site, sites } = useCurrentSite();

  return (
    <TextField
      select
      size="small"
      label={t('Website')}
      value={site.slug}
      onChange={(event) => navigate(switchSitePath(pathname, event.target.value))}
      sx={{ minWidth: 220 }}
    >
      {sites.map((option) => (
        <MenuItem key={option.id} value={option.slug}>
          {option.isDefault ? t('{name} (default)', { name: option.name }) : option.name}
        </MenuItem>
      ))}
    </TextField>
  );
}

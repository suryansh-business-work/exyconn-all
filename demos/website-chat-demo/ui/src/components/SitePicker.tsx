import { useT } from '@exyconn/i18n';
import type { CatalogBundle } from '@exyconn/bot-studio/runtime';
import { WA_ICONS } from '@exyconn/bot-studio/icons';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@exyconn/shell/components/ui';

interface SitePickerProps {
  sites: readonly CatalogBundle[];
  current: string;
  onPick: (key: string) => void;
}

/** Which demo website's agent to talk to: a services firm, an online store, or any added later. */
export function SitePicker({ sites, current, onPick }: Readonly<SitePickerProps>) {
  const t = useT();
  return (
    <Box>
      <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>
        {t('Pick a website')}
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={current}
        onChange={(_event, key: string | null) => key && onPick(key)}
        aria-label={t('Pick a website')}
        sx={{ flexWrap: 'wrap' }}
      >
        {sites.map(({ demo }) => {
          const Icon = WA_ICONS[demo.business.icon];
          return (
            <ToggleButton
              key={demo.key}
              value={demo.key}
              sx={{ gap: 1, textTransform: 'none', alignItems: 'flex-start' }}
            >
              <Icon aria-hidden />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" component="span" sx={{ display: 'block' }}>
                  {demo.industry}
                </Typography>
                <Typography
                  variant="caption"
                  component="span"
                  sx={{ display: 'block', color: 'text.secondary' }}
                >
                  {demo.business.name}
                </Typography>
              </Box>
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    </Box>
  );
}

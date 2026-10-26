import { useMemo } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { PageSideNav } from '@exyconn/shell/components/navigation/PageSideNav';
import { useTabberSlug } from '@exyconn/tabber';
import { ENVIRONMENT_VARIABLES_SECTIONS } from './environmentVariables.sections';
import { TechVaultGate } from './vault/TechVaultGate';
import { ProviderAdvanced } from './advanced/ProviderAdvanced';
import { ConfigTransfer } from './advanced/ConfigTransfer';
import { GlobalTransferBar } from './advanced/GlobalTransferBar';

/** Sections that hold no configs of their own, so they offer no section export. */
const NO_CONFIGS: ReadonlySet<string> = new Set([
  'dashboard',
  'ai-pricing',
  'access-history',
  'usage-history',
]);

/** Route the integrations live under; each one is a slug beneath it. */
export const ENVIRONMENT_VARIABLES_PATH = '/tech/environment-variables';

/**
 * Environment Variables — the integration credentials the whole platform runs on,
 * stored in the database rather than in a .env file so they can be rotated and
 * verified here without a redeploy. A categorised side menu picks the integration;
 * which one is open lives in the URL. Locked behind a one-time code (TechVaultGate).
 */
export function EnvironmentVariablesPage() {
  const slugs = useMemo(() => ENVIRONMENT_VARIABLES_SECTIONS.map((section) => section.slug), []);
  const { slug, selectSlug } = useTabberSlug(ENVIRONMENT_VARIABLES_PATH, slugs);
  const active = ENVIRONMENT_VARIABLES_SECTIONS.find((section) => section.slug === slug);

  return (
    <TechVaultGate>
      <GlobalTransferBar />
      <PageSideNav
        items={ENVIRONMENT_VARIABLES_SECTIONS}
        selected={slug}
        onSelect={selectSlug}
        ariaLabel="Integration credentials"
      >
        {active && (
          <Box sx={readingPanel}>
            {active.panel}
            <ProviderAdvanced key={active.slug} provider={active.slug} />
            {!NO_CONFIGS.has(active.slug) && (
              <Box sx={{ mt: 3 }}>
                <ConfigTransfer key={active.slug} section={active.slug} />
              </Box>
            )}
          </Box>
        )}
      </PageSideNav>
    </TechVaultGate>
  );
}

import type { SvgIconComponent } from '@mui/icons-material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from '@mui/icons-material/X';
import LanguageIcon from '@mui/icons-material/Language';
import { useT } from '@exyconn/i18n';
import { Flex, Link, Tooltip } from '@/components/ui';
import type { ProfileDetailsFieldsFragment } from '@/graphql/generated';

type SocialLinks = NonNullable<ProfileDetailsFieldsFragment['socialLinks']>;
type Network = keyof Omit<SocialLinks, '__typename'>;

interface NetworkSpec {
  key: Network;
  label: string;
  icon: SvgIconComponent;
}

/** Every network a profile can link to, in the order they are shown and edited. */
export const SOCIAL_NETWORKS: readonly NetworkSpec[] = [
  { key: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon },
  { key: 'github', label: 'GitHub', icon: GitHubIcon },
  { key: 'twitter', label: 'X (Twitter)', icon: XIcon },
  { key: 'website', label: 'Website', icon: LanguageIcon },
];

interface SocialLinkButtonsProps {
  links: ProfileDetailsFieldsFragment['socialLinks'];
  justifyContent?: 'flex-start' | 'center';
}

/** One icon link per link the person shared; renders nothing when they shared none. */
export function SocialLinkButtons({
  links,
  justifyContent = 'flex-start',
}: Readonly<SocialLinkButtonsProps>) {
  const t = useT();
  const shared = SOCIAL_NETWORKS.filter((network) => links?.[network.key]);
  if (shared.length === 0) {
    return null;
  }
  return (
    <Flex direction="row" spacing={0.5} justifyContent={justifyContent}>
      {shared.map(({ key, label, icon: Icon }) => (
        <Tooltip key={key} title={t(label)}>
          <Link
            href={links?.[key] ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(label)}
            color="text.secondary"
            sx={{
              display: 'inline-flex',
              p: 1,
              borderRadius: '50%',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <Icon fontSize="small" />
          </Link>
        </Tooltip>
      ))}
    </Flex>
  );
}

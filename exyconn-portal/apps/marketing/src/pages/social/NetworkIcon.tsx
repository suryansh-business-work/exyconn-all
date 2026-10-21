import type { SvgIconComponent } from '@mui/icons-material';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
import type { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { NETWORK_LABEL } from './social.labels';

/** Each network's brand mark. MUI has none for Threads, so it gets the plain @ sign. */
const NETWORK_ICON: Readonly<Record<SocialNetwork, SvgIconComponent>> = {
  LINKEDIN: LinkedInIcon,
  FACEBOOK: FacebookIcon,
  INSTAGRAM: InstagramIcon,
  THREADS: AlternateEmailIcon,
  X: XIcon,
  YOUTUBE: YouTubeIcon,
};

interface NetworkIconProps {
  network: SocialNetwork;
  /** What a screen reader hears; the network's name unless said otherwise. */
  label?: string;
  fontSize?: 'small' | 'medium';
  /** Beside a visible name already: hidden from screen readers, so it is not read twice. */
  decorative?: boolean;
}

/** A network's mark, named for screen readers unless a visible name sits beside it. */
export function NetworkIcon({
  network,
  label,
  fontSize = 'small',
  decorative = false,
}: Readonly<NetworkIconProps>) {
  const Icon = NETWORK_ICON[network] as SvgIconComponent | undefined;
  // A network the server added before this page knew of it: its name says enough.
  if (!Icon) return null;
  if (decorative) return <Icon fontSize={fontSize} color="primary" aria-hidden />;
  return <Icon fontSize={fontSize} color="primary" titleAccess={label ?? NETWORK_LABEL[network]} />;
}

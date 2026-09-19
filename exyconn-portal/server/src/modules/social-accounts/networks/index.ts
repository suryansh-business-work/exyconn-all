import type { SocialNetwork } from '../social.constants';
import { facebook, instagram } from './meta';
import { linkedin } from './linkedin';
import { x } from './x';
import { youtube } from './youtube';
import type { NetworkClient } from './network.types';

export const NETWORKS: Readonly<Record<SocialNetwork, NetworkClient>> = {
  LINKEDIN: linkedin,
  FACEBOOK: facebook,
  INSTAGRAM: instagram,
  X: x,
  YOUTUBE: youtube,
};
export type { NetworkPost, OutgoingPost, PublishedPost } from './network.types';

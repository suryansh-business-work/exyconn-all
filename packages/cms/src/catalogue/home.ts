import type { CmsComponentDef } from './types';
import { HOME_HERO_PROPS, HOME_SOLUTIONS_PROPS, HOME_STAGE_PROPS } from './home.copy';
import {
  HOME_CLOSING_PROPS,
  HOME_INDUSTRIES_PROPS,
  HOME_PARTNER_PROPS,
  HOME_PLATFORMS_PROPS,
} from './home.copy-more';

/** The scroll-driven home page: the stage and the chapters that scroll over it. */
export const HOME_COMPONENTS = [
  {
    key: 'home.stage',
    label: 'Home stage',
    category: 'Home',
    description:
      'The night band with the 3D scene and the chapter rail. Drop the chapters inside it; the rail lists the chapters by id.',
    defaultProps: HOME_STAGE_PROPS,
    acceptsChildren: true,
  },
  {
    key: 'home.hero',
    label: 'Hero chapter',
    category: 'Home',
    description: 'The opening chapter: headline, lead, buttons, stats and feature list.',
    defaultProps: HOME_HERO_PROPS,
  },
  {
    key: 'home.solutions',
    label: 'Solutions chapter',
    category: 'Home',
    description: 'What we offer: the pillars, quick links and the AI service catalogue.',
    defaultProps: HOME_SOLUTIONS_PROPS,
  },
  {
    key: 'home.industries',
    label: 'Industries chapter',
    category: 'Home',
    description: 'The industries served, a closing prompt and the process steps.',
    defaultProps: HOME_INDUSTRIES_PROPS,
  },
  {
    key: 'home.partner',
    label: 'Partner chapter',
    category: 'Home',
    description: 'Why choose us: value list, image with stats and the technology logos.',
    defaultProps: HOME_PARTNER_PROPS,
  },
  {
    key: 'home.platforms',
    label: 'Platforms marquee',
    category: 'Home',
    description: 'Rows of platform logos sliding in opposite directions.',
    defaultProps: HOME_PLATFORMS_PROPS,
  },
  {
    key: 'home.closing',
    label: 'Closing chapter',
    category: 'Home',
    description: "The company's name, slogan and description (Admin › Branding) with two buttons.",
    defaultProps: HOME_CLOSING_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];

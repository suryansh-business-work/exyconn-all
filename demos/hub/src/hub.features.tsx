import TranslateIcon from '@mui/icons-material/Translate';
import HubIcon from '@mui/icons-material/Hub';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import InsightsIcon from '@mui/icons-material/Insights';
import type { DemoFeature } from '@exyconn/demo-visitor/page';

/** Why a business picks the agents behind the demos. */
export const HUB_FEATURES: readonly DemoFeature[] = [
  {
    icon: <TranslateIcon />,
    title: 'Speaks your customers’ language',
    body: 'English, Hindi and other Indian languages, by voice and in chat.',
  },
  {
    icon: <HubIcon />,
    title: 'Works with your systems',
    body: 'Connects to your CRM, calendar, payments and helpdesk.',
  },
  {
    icon: <SupportAgentIcon />,
    title: 'Hands over to your team',
    body: 'Passes a conversation to a person, with everything said so far, when it needs one.',
  },
  {
    icon: <InsightsIcon />,
    title: 'Every conversation measured',
    body: 'Transcripts and analytics for every chat and call, to see what customers ask.',
  },
];

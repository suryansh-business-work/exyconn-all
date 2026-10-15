import type { DemoFeature } from '@exyconn/demo-visitor/page';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InsightsIcon from '@mui/icons-material/Insights';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TranslateIcon from '@mui/icons-material/Translate';

/** Why businesses put the agent on their site. */
export const FEATURES: readonly DemoFeature[] = [
  {
    icon: <AccessTimeIcon />,
    title: 'Answers in seconds, 24×7',
    body: 'Every visitor gets an answer the moment they ask, at 3 pm or 3 am.',
  },
  {
    icon: <PersonAddIcon />,
    title: 'Turns visitors into leads',
    body: 'Name, email, phone and what they need, captured in the chat and sent to your CRM.',
  },
  {
    icon: <EventAvailableIcon />,
    title: 'Books meetings and visits',
    body: 'Live slots from your calendar, a confirmation pass and a calendar invite in one chat.',
  },
  {
    icon: <PaymentsIcon />,
    title: 'Sells and takes orders',
    body: 'Product finder, catalogue, offers and a payment step, without leaving the page.',
  },
  {
    icon: <SupportAgentIcon />,
    title: 'Hands over to your team',
    body: 'Hard questions go to a person with the whole conversation, on chat, WhatsApp or email.',
  },
  {
    icon: <TranslateIcon />,
    title: 'Speaks your customers’ language',
    body: 'English, Hindi and other languages, with free-text understanding by AI.',
  },
  {
    icon: <AccountTreeIcon />,
    title: 'Workflows you can edit',
    body: 'A visual flow designer: change a question, a price or a path and publish in minutes.',
  },
  {
    icon: <InsightsIcon />,
    title: 'Every chat measured',
    body: 'Sessions, completions and drop-offs per workflow, so you know what converts.',
  },
];

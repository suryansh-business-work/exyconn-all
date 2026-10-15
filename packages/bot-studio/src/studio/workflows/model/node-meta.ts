/**
 * How each node type looks in the editor: its name, icon, theme colour and palette group,
 * and a one-line summary of what a node of it says. Colours are theme palette keys, never
 * raw values, so the canvas follows the portal theme in light and dark.
 */
import type { SvgIconComponent } from '@mui/icons-material';
import NotesIcon from '@mui/icons-material/Notes';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import ListIcon from '@mui/icons-material/List';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import PlaceIcon from '@mui/icons-material/Place';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import SellIcon from '@mui/icons-material/Sell';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InfoIcon from '@mui/icons-material/Info';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import AlarmIcon from '@mui/icons-material/Alarm';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import type { NodeType } from '@exyconn/wa-flow';

export type NodeColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export type NodeGroup = 'Messages' | 'Interactive' | 'Rich cards' | 'Customer input' | 'Logic';

export interface NodeMeta {
  /** English source, translated where shown. */
  label: string;
  hint: string;
  icon: SvgIconComponent;
  color: NodeColor;
  group: NodeGroup;
}

export const NODE_GROUPS: readonly NodeGroup[] = [
  'Messages',
  'Interactive',
  'Rich cards',
  'Customer input',
  'Logic',
];

export const NODE_META: Readonly<Record<NodeType, NodeMeta>> = {
  text: {
    label: 'Text',
    hint: 'A plain message',
    icon: NotesIcon,
    color: 'primary',
    group: 'Messages',
  },
  notice: {
    label: 'Notice',
    hint: 'A centred system notice',
    icon: InfoIcon,
    color: 'primary',
    group: 'Messages',
  },
  image: {
    label: 'Image',
    hint: 'An illustration with a caption',
    icon: ImageIcon,
    color: 'primary',
    group: 'Messages',
  },
  document: {
    label: 'Document',
    hint: 'A PDF, sheet or doc to open',
    icon: DescriptionIcon,
    color: 'primary',
    group: 'Messages',
  },
  location: {
    label: 'Location',
    hint: 'A map pin',
    icon: PlaceIcon,
    color: 'primary',
    group: 'Messages',
  },
  contact: {
    label: 'Contact',
    hint: 'A contact card',
    icon: ContactPhoneIcon,
    color: 'primary',
    group: 'Messages',
  },
  buttons: {
    label: 'Buttons',
    hint: 'Up to three reply buttons',
    icon: SmartButtonIcon,
    color: 'secondary',
    group: 'Interactive',
  },
  list: {
    label: 'List',
    hint: 'A menu of rows in sections',
    icon: ListIcon,
    color: 'secondary',
    group: 'Interactive',
  },
  cta: {
    label: 'Call to action',
    hint: 'Link, call or calendar buttons',
    icon: OpenInNewIcon,
    color: 'secondary',
    group: 'Interactive',
  },
  product: {
    label: 'Product',
    hint: 'One product card',
    icon: SellIcon,
    color: 'success',
    group: 'Rich cards',
  },
  carousel: {
    label: 'Carousel',
    hint: 'Swipeable product cards',
    icon: ViewCarouselIcon,
    color: 'success',
    group: 'Rich cards',
  },
  ticket: {
    label: 'Ticket',
    hint: 'A pass with a QR code',
    icon: ConfirmationNumberIcon,
    color: 'success',
    group: 'Rich cards',
  },
  order: {
    label: 'Order',
    hint: 'An order summary with Pay',
    icon: ReceiptLongIcon,
    color: 'success',
    group: 'Rich cards',
  },
  input: {
    label: 'Ask',
    hint: 'Ask and check a typed answer',
    icon: KeyboardIcon,
    color: 'info',
    group: 'Customer input',
  },
  ai: {
    label: 'AI reader',
    hint: 'Understand free text with OpenAI',
    icon: PsychologyIcon,
    color: 'info',
    group: 'Customer input',
  },
  condition: {
    label: 'Condition',
    hint: 'Branch on a variable',
    icon: CallSplitIcon,
    color: 'warning',
    group: 'Logic',
  },
  delay: {
    label: 'Delay',
    hint: 'Show typing for a while',
    icon: HourglassBottomIcon,
    color: 'warning',
    group: 'Logic',
  },
  reminder: {
    label: 'Reminder',
    hint: 'Send a message later',
    icon: AlarmIcon,
    color: 'warning',
    group: 'Logic',
  },
  handoff: {
    label: 'Handoff',
    hint: 'A person joins the chat',
    icon: SupportAgentIcon,
    color: 'warning',
    group: 'Logic',
  },
  jump: {
    label: 'Jump',
    hint: 'Start another workflow',
    icon: ShortcutIcon,
    color: 'error',
    group: 'Logic',
  },
  end: {
    label: 'End',
    hint: 'Finish and offer the menu',
    icon: StopCircleIcon,
    color: 'error',
    group: 'Logic',
  },
};

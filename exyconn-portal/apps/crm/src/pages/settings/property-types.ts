import type { SvgIconComponent } from '@mui/icons-material';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import EventIcon from '@mui/icons-material/Event';
import LinkIcon from '@mui/icons-material/Link';
import NotesIcon from '@mui/icons-material/Notes';
import NumbersIcon from '@mui/icons-material/Numbers';
import PhoneIcon from '@mui/icons-material/Phone';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ShortTextIcon from '@mui/icons-material/ShortText';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import {
  CrmObject,
  CrmObjectSchemaDocument,
  CrmPropertiesDocument,
  CrmPropertyType,
} from '@exyconn/shell/graphql/generated';

/** Each property type in plain language, in the order the type picker offers them. */
export const PROPERTY_TYPE_LABELS: Readonly<Record<CrmPropertyType, string>> = {
  [CrmPropertyType.Text]: 'Single-line text',
  [CrmPropertyType.Textarea]: 'Multi-line text',
  [CrmPropertyType.Email]: 'Email',
  [CrmPropertyType.Phone]: 'Phone number',
  [CrmPropertyType.Url]: 'Website',
  [CrmPropertyType.Number]: 'Number',
  [CrmPropertyType.Date]: 'Date',
  [CrmPropertyType.Enum]: 'Dropdown select',
  [CrmPropertyType.Radio]: 'Radio buttons',
  [CrmPropertyType.MultiSelect]: 'Checkboxes (pick several)',
  [CrmPropertyType.Boolean]: 'Yes/No',
  [CrmPropertyType.File]: 'File upload',
};

/** What each type is for, under its name in the type picker. */
export const PROPERTY_TYPE_HINTS: Readonly<Record<CrmPropertyType, string>> = {
  [CrmPropertyType.Text]: 'A name, a code or a short answer',
  [CrmPropertyType.Textarea]: 'Notes or a longer answer over several lines',
  [CrmPropertyType.Email]: 'An address checked to look like an email',
  [CrmPropertyType.Phone]: 'A number that can be dialled from the record',
  [CrmPropertyType.Url]: 'A link that opens in a new tab',
  [CrmPropertyType.Number]: 'A count, an amount or a score',
  [CrmPropertyType.Date]: 'A day picked from a calendar',
  [CrmPropertyType.Enum]: 'One choice from a list you set',
  [CrmPropertyType.Radio]: 'One choice, with every option shown',
  [CrmPropertyType.MultiSelect]: 'Any number of choices from a list you set',
  [CrmPropertyType.Boolean]: 'A single switch',
  [CrmPropertyType.File]: 'A document or image uploaded to the record',
};

/** The icon beside each type, so the picker can be scanned. */
export const PROPERTY_TYPE_ICONS: Readonly<Record<CrmPropertyType, SvgIconComponent>> = {
  [CrmPropertyType.Text]: ShortTextIcon,
  [CrmPropertyType.Textarea]: NotesIcon,
  [CrmPropertyType.Email]: AlternateEmailIcon,
  [CrmPropertyType.Phone]: PhoneIcon,
  [CrmPropertyType.Url]: LinkIcon,
  [CrmPropertyType.Number]: NumbersIcon,
  [CrmPropertyType.Date]: EventIcon,
  [CrmPropertyType.Enum]: ArrowDropDownCircleIcon,
  [CrmPropertyType.Radio]: RadioButtonCheckedIcon,
  [CrmPropertyType.MultiSelect]: CheckBoxIcon,
  [CrmPropertyType.Boolean]: ToggleOnIcon,
  [CrmPropertyType.File]: AttachFileIcon,
};

/** The record types a property can be added to, in the order the settings tabs show them. */
export const PROPERTY_OBJECTS: ReadonlyArray<{ object: CrmObject; label: string }> = [
  { object: CrmObject.Lead, label: 'Leads' },
  { object: CrmObject.Company, label: 'Companies' },
  { object: CrmObject.Contact, label: 'Contacts' },
];

/** The permission module properties are restricted under in Admin > Roles & Permissions. */
export const PROPERTY_PERMISSION_MODULE = 'CrmProperty';

/**
 * The queries to re-read after a property changes, so the lists' columns and the record forms
 * pick it up along with this screen.
 */
export const propertyRefetches = (object: CrmObject) => [
  { query: CrmObjectSchemaDocument, variables: { object } },
  { query: CrmPropertiesDocument, variables: { object } },
];

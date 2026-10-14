/**
 * The icon behind each `icon` name a workflow may use (`ICON_KEYS` in @exyconn/wa-flow).
 * A `Record` over every key, so adding a key there fails the type check until it has an icon here.
 */
import type { SvgIconComponent } from '@mui/icons-material';
import type { IconKey } from '@exyconn/wa-flow';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BabyChangingStationIcon from '@mui/icons-material/BabyChangingStation';
import BedIcon from '@mui/icons-material/Bed';
import BoltIcon from '@mui/icons-material/Bolt';
import BuildIcon from '@mui/icons-material/Build';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CallIcon from '@mui/icons-material/Call';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DescriptionIcon from '@mui/icons-material/Description';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EmergencyShareIcon from '@mui/icons-material/EmergencyShare';
import EventIcon from '@mui/icons-material/Event';
import FaceIcon from '@mui/icons-material/Face';
import FactoryIcon from '@mui/icons-material/Factory';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import FlightIcon from '@mui/icons-material/Flight';
import GavelIcon from '@mui/icons-material/Gavel';
import GroupsIcon from '@mui/icons-material/Groups';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import HomeIcon from '@mui/icons-material/Home';
import HotelIcon from '@mui/icons-material/Hotel';
import InfoIcon from '@mui/icons-material/Info';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import KeyIcon from '@mui/icons-material/Key';
import LaptopIcon from '@mui/icons-material/Laptop';
import LinkIcon from '@mui/icons-material/Link';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import MailIcon from '@mui/icons-material/Mail';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import MedicationIcon from '@mui/icons-material/Medication';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MoodIcon from '@mui/icons-material/Mood';
import MovieIcon from '@mui/icons-material/Movie';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonIcon from '@mui/icons-material/Person';
import PetsIcon from '@mui/icons-material/Pets';
import PlaceIcon from '@mui/icons-material/Place';
import PsychologyIcon from '@mui/icons-material/Psychology';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import SpaIcon from '@mui/icons-material/Spa';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StarIcon from '@mui/icons-material/Star';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TrainIcon from '@mui/icons-material/Train';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WifiIcon from '@mui/icons-material/Wifi';

export const WA_ICONS: Readonly<Record<IconKey, SvgIconComponent>> = {
  business: BusinessIcon,
  chat: ChatIcon,
  calendar: CalendarMonthIcon,
  clock: ScheduleIcon,
  location: PlaceIcon,
  phone: CallIcon,
  mail: MailIcon,
  document: DescriptionIcon,
  receipt: ReceiptLongIcon,
  payment: PaymentsIcon,
  ticket: ConfirmationNumberIcon,
  qr: QrCode2Icon,
  gift: CardGiftcardIcon,
  star: StarIcon,
  offer: LocalOfferIcon,
  support: SupportAgentIcon,
  info: InfoIcon,
  check: CheckCircleIcon,
  warning: WarningIcon,
  person: PersonIcon,
  family: FamilyRestroomIcon,
  child: ChildCareIcon,
  group: GroupsIcon,
  home: HomeIcon,
  search: SearchIcon,
  link: LinkIcon,
  bell: NotificationsIcon,
  lock: LockIcon,
  cart: ShoppingCartIcon,
  bag: ShoppingBagIcon,
  hospital: LocalHospitalIcon,
  doctor: MedicalServicesIcon,
  stethoscope: MonitorHeartIcon,
  lab: ScienceIcon,
  vaccine: VaccinesIcon,
  pill: MedicationIcon,
  heart: FavoriteIcon,
  tooth: MoodIcon,
  eye: VisibilityIcon,
  bone: AccessibilityIcon,
  brain: PsychologyIcon,
  baby: BabyChangingStationIcon,
  report: AssignmentIcon,
  ambulance: EmergencyShareIcon,
  school: SchoolIcon,
  book: MenuBookIcon,
  bank: AccountBalanceIcon,
  card: CreditCardIcon,
  loan: RequestQuoteIcon,
  insurance: HealthAndSafetyIcon,
  car: DirectionsCarIcon,
  bike: TwoWheelerIcon,
  truck: LocalShippingIcon,
  flight: FlightIcon,
  train: TrainIcon,
  hotel: HotelIcon,
  bed: BedIcon,
  restaurant: RestaurantIcon,
  food: FastfoodIcon,
  coffee: LocalCafeIcon,
  grocery: LocalGroceryStoreIcon,
  store: StorefrontIcon,
  shirt: CheckroomIcon,
  beauty: FaceIcon,
  spa: SpaIcon,
  fitness: FitnessCenterIcon,
  sports: SportsSoccerIcon,
  movie: MovieIcon,
  music: MusicNoteIcon,
  event: EventIcon,
  realestate: ApartmentIcon,
  key: KeyIcon,
  tools: BuildIcon,
  electricity: BoltIcon,
  water: WaterDropIcon,
  wifi: WifiIcon,
  mobile: SmartphoneIcon,
  laptop: LaptopIcon,
  pet: PetsIcon,
  plant: LocalFloristIcon,
  government: AccountBalanceWalletIcon,
  legal: GavelIcon,
  shipping: Inventory2Icon,
  factory: FactoryIcon,
  solar: SolarPowerIcon,
};

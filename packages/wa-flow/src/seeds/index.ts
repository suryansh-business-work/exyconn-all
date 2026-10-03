/**
 * The default industries, seeded onto the server once (boot `runOnce` ledger) and editable at
 * /admin/bot-workflows from then on. Register a new industry by importing it here — the array
 * order is the chat-list order.
 */
import type { SeedDemo } from '../author';
import { automobile } from './automobile';
import { clinic } from './clinic';
import { coworking } from './coworking';
import { education } from './education';
import { events } from './events';
import { finance } from './finance';
import { fitness } from './fitness';
import { healthcare } from './healthcare';
import { homeServices } from './home-services';
import { hotel } from './hotel';
import { legal } from './legal';
import { petCare } from './pet-care';
import { publicServices } from './public-services';
import { realEstate } from './real-estate';
import { recruitment } from './recruitment';
import { restaurant } from './restaurant';
import { retail } from './retail';
import { saas } from './saas';
import { salon } from './salon';
import { travel } from './travel';

export const SEED_DEMOS: readonly SeedDemo[] = [
  healthcare,
  salon,
  restaurant,
  hotel,
  education,
  realEstate,
  automobile,
  petCare,
  fitness,
  legal,
  finance,
  travel,
  events,
  homeServices,
  clinic,
  retail,
  saas,
  recruitment,
  publicServices,
  coworking,
];

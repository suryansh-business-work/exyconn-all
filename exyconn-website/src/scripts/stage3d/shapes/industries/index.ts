import type { ShapeDefinition } from "../registry";
import { AUTOMOTIVE } from "./automotive";
import { BEAUTY } from "./beauty";
import { BFSI } from "./bfsi";
import { CAFE } from "./cafe";
import { CONSTRUCTION } from "./construction";
import { EDUCATION } from "./education";
import { EVENTS } from "./events";
import { FITNESS } from "./fitness";
import { HEALTHCARE } from "./healthcare";
import { HOSPITALITY } from "./hospitality";
import { HR_RECRUITMENT } from "./hr-recruitment";
import { LEGAL } from "./legal";
import { LOGISTICS } from "./logistics";
import { MANUFACTURING } from "./manufacturing";
import { PROFESSIONAL_SERVICES } from "./professional-services";
import { REAL_ESTATE } from "./real-estate";
import { RESTAURANT } from "./restaurant";
import { RETAIL } from "./retail";
import { SAAS } from "./saas";
import { TRAVEL } from "./travel";
import { INDUSTRY_BOUNDS, INDUSTRY_PITCH, industryScene, type IndustryLandmark } from "./kit";

/**
 * One scene per industry page (/industries/*), each its landmark with six wired use cases
 * (see ./kit.ts). The id is the one a page's `scene.shapes` names.
 */
export const INDUSTRY_LANDMARKS = {
  hospitality: HOSPITALITY,
  cafe: CAFE,
  restaurant: RESTAURANT,
  travel: TRAVEL,
  healthcare: HEALTHCARE,
  beauty: BEAUTY,
  fitness: FITNESS,
  events: EVENTS,
  realEstate: REAL_ESTATE,
  construction: CONSTRUCTION,
  manufacturing: MANUFACTURING,
  automotive: AUTOMOTIVE,
  retail: RETAIL,
  logistics: LOGISTICS,
  education: EDUCATION,
  saas: SAAS,
  bfsi: BFSI,
  legal: LEGAL,
  professionalServices: PROFESSIONAL_SERVICES,
  hrRecruitment: HR_RECRUITMENT,
} as const satisfies Record<string, IndustryLandmark>;

export type IndustryShapeId = keyof typeof INDUSTRY_LANDMARKS;

type IndustryShapes = { readonly [K in IndustryShapeId]: ShapeDefinition<Record<string, never>> };

export const INDUSTRY_SHAPES = Object.fromEntries(
  Object.entries(INDUSTRY_LANDMARKS).map(([id, landmark]) => [
    id,
    {
      bounds: INDUSTRY_BOUNDS,
      motion: "sway",
      pitch: INDUSTRY_PITCH,
      sample: industryScene(landmark),
    },
  ])
) as IndustryShapes;

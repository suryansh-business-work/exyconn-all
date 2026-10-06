import type { CmsComponentKey } from "@exyconn/cms";
import ChromeFooter from "./chrome/ChromeFooter.astro";
import ChromeHeader from "./chrome/ChromeHeader.astro";
import ClosingChapter from "../home/ClosingChapter.astro";
import HeroChapter from "../home/HeroChapter.astro";
import HomeStage from "../home/HomeStage.astro";
import IndustriesChapter from "../home/IndustriesChapter.astro";
import PartnerChapter from "../home/PartnerChapter.astro";
import PlatformsMarquee from "../home/PlatformsMarquee.astro";
import SolutionsChapter from "../home/SolutionsChapter.astro";

/** Any Astro component, whatever its props. */
type CmsRenderer = (props: never) => unknown;

/**
 * Every CMS component key (@exyconn/cms CMS_COMPONENTS) → the Astro component that renders
 * it. `satisfies Record<CmsComponentKey, …>` is the agreement check: a catalogue key with no
 * renderer, or a renderer for a key the catalogue does not have, fails `pnpm typecheck` (and
 * so CI). Each component receives its block's props plus `cms` (CmsRenderContext), and a
 * component that takes children gets them as its default slot.
 *
 * Every component here is imported by every CMS page, so its CSS ships with all of them:
 * keep component styles scoped (`<style>` in the component) or namespaced to the component.
 */
const REGISTRY = {
  "chrome.header": ChromeHeader,
  "chrome.footer": ChromeFooter,
  "home.stage": HomeStage,
  "home.hero": HeroChapter,
  "home.solutions": SolutionsChapter,
  "home.industries": IndustriesChapter,
  "home.partner": PartnerChapter,
  "home.platforms": PlatformsMarquee,
  "home.closing": ClosingChapter,
} satisfies Record<CmsComponentKey, CmsRenderer>;

/**
 * A renderer as CmsBlocks calls it: with the JSON props the CMS stored. Those are only as
 * typed as the editor's JSON, so each component's own Props are deliberately not enforced here.
 */
export type CmsComponent = (props: Record<string, unknown>) => unknown;

const isKey = (key: string): key is CmsComponentKey => Object.hasOwn(REGISTRY, key);

/** The component for a key, or undefined for a key this build does not know. */
export function cmsRenderer(key: string): CmsComponent | undefined {
  return isKey(key) ? (REGISTRY[key] as unknown as CmsComponent) : undefined;
}

import type { IconName } from '../../components/ui/Icon';

/** One labelled line inside a tile's detail. */
export interface TileFact {
  id: string;
  label: string;
  value: string;
}

/**
 * What a tile says when you open it.
 *
 * Every tile answers the same two questions, because a number on a monitoring dashboard is
 * only half a fact: what exactly is this figure, and what rule produced it? A "Worked" tile
 * that will not say what counts as worked is asking to be argued with.
 */
export interface TileDetail {
  /** The number again, unabbreviated — tiles truncate, this does not. */
  headline: string;
  facts: TileFact[];
  /** The rule, the privacy promise, or the caveat. Always present. */
  note: string;
}

/**
 * One dashboard number. The icon is a NAME, not a component, so the builders stay pure and
 * testable — the tile component draws it.
 */
export interface Tile {
  id: string;
  label: string;
  value: string;
  icon: IconName;
  detail: TileDetail;
}

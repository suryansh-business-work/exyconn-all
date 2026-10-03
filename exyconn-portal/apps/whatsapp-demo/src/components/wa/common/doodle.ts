/**
 * The chat wallpaper: our own doodle tile (chat bubbles, hearts, stars, phones, clocks…),
 * drawn as one SVG in the palette's doodle colour and repeated behind the messages.
 */
const SHAPES = [
  // chat bubble
  'M14 18h26a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H24l-8 6v-6h-2a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z',
  // heart
  'M92 30c-4-8-16-6-16 3 0 7 9 12 16 18 7-6 16-11 16-18 0-9-12-11-16-3z',
  // star
  'M150 12l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z',
  // phone handset
  'M30 86c6 10 14 18 24 24l6-6c1-1 3-1 4 0l8 4c1 1 2 2 1 4l-3 8c-1 2-3 3-5 2-20-6-36-22-42-42-1-2 0-4 2-5l8-3c2-1 3 0 4 1l4 8c1 1 1 3 0 4z',
  // clock
  'M128 92a14 14 0 1 0 0.1 0zM128 98v8l6 4',
  // camera
  'M178 70h8l3-5h10l3 5h8a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3h-32a3 3 0 0 1-3-3V73a3 3 0 0 1 3-3zM194 75a7 7 0 1 0 0.1 0z',
  // tick
  'M80 140l8 8 16-16',
  // smile
  'M30 150a12 12 0 1 0 0.1 0zM24 158q6 6 12 0M25 152h1M35 152h1',
  // music note
  'M170 130v22a5 5 0 1 1-4-5v-21l16-4v18a5 5 0 1 1-4-5v-10z',
  // paper plane
  'M120 170l36-14-14 36-6-14z',
  // dots
  'M66 60h1M196 30h1M100 110h1M8 120h1M150 60h1',
];

/** A data URI of the tile, for `background-image`. */
export function doodleTile(stroke: string): string {
  const paths = SHAPES.map(
    (d) =>
      `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="200" viewBox="0 0 220 200">${paths}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

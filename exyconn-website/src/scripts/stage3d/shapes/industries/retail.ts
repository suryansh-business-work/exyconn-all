import {
  drawBlock,
  GROUND,
  onDrawing,
  onFacade,
  onPolyline,
  rise,
  type Block,
  type IndustryLandmark,
} from "./kit";
import { arc, box, roundedRect } from "../../../../lib/detail/glyphs";
import { between, onBox, pickIndex, type Random, type Vec3 } from "../sampling";

/**
 * Retail and e-commerce: a shop that sells in store and online. A storefront with a striped
 * awning over two display windows and a door stands at the back, a giant shopping bag with
 * rope handles sits at the front right, a phone at the front left shows the same shop as a
 * grid of products under a search bar, and a few parcels wait to ship. Use cases: product
 * discovery lands on the phone's search bar, cart recovery on the bag's handles, order
 * tracking on the parcels, returns at the shop door, stock forecasting in the display window
 * and campaigns on the shop sign.
 */
const SHOP: Block = [-0.15, -0.55, 1.7, 0.7, 1.2];
const SHOP_FRONT = SHOP[1] + SHOP[3] / 2;
const SHOP_LEFT = SHOP[0] - SHOP[2] / 2;
const SHOP_RIGHT = SHOP[0] + SHOP[2] / 2;
const AWNING_Y = GROUND + 0.88;
const SIGN_Y = GROUND + 1.04;
const WINDOWS = [-0.62, 0.0];
const WINDOW_W = 0.5;
const DOOR_X = 0.45;
const BAG: Vec3 = [1.2, GROUND + 0.36, 0.35];
const BAG_SIZE: Vec3 = [0.58, 0.72, 0.26];
const PHONE: Vec3 = [-1.4, GROUND + 0.48, 0.5];
const PHONE_SCALE = 0.4;
const PARCELS: readonly Vec3[] = [
  [-0.45, GROUND + 0.1, 0.72],
  [-0.2, GROUND + 0.1, 0.78],
  [-0.33, GROUND + 0.3, 0.74],
];

/** The awning: a striped slope out from the wall, scalloped along its front edge. */
const awning = (r: Random): Vec3 => {
  const x = between(r, SHOP_LEFT, SHOP_RIGHT);
  if (r() < 0.35) {
    const scallop = 0.025 * Math.abs(Math.sin(x * 18));
    return [x, AWNING_Y - 0.16 - scallop, SHOP_FRONT + 0.3];
  }
  const stripe = Math.round(x * 10) / 10;
  const t = r();
  return [stripe, AWNING_Y - t * 0.16, SHOP_FRONT + t * 0.3];
};

/** The two display windows and the door, framed on the front wall, with goods in the windows. */
const shopfront = (r: Random): Vec3 => {
  const z = SHOP_FRONT + 0.005;
  if (r() < 0.25) {
    return onPolyline(
      r,
      [
        [DOOR_X - 0.13, GROUND, z],
        [DOOR_X - 0.13, GROUND + 0.6, z],
        [DOOR_X + 0.13, GROUND + 0.6, z],
        [DOOR_X + 0.13, GROUND, z],
      ],
      0.005
    );
  }
  const x = WINDOWS[pickIndex(r, WINDOWS.length)];
  if (r() < 0.55) {
    return onDrawing(r, [box(-1, -0.72, 1, 0.72)], [x, GROUND + 0.42, z], WINDOW_W / 2);
  }
  const item = pickIndex(r, 3);
  return onBox(
    r,
    [x - 0.15 + item * 0.15, GROUND + 0.24 + item * 0.04, SHOP_FRONT - 0.08],
    [0.1, 0.12 + item * 0.08, 0.08]
  );
};

/** The sign band over the awning: its frame and a row of lettering. */
const sign = (r: Random): Vec3 => {
  const z = SHOP_FRONT + 0.01;
  if (r() < 0.5) {
    return onDrawing(r, [box(-1, -0.16, 1, 0.16)], [SHOP[0], SIGN_Y, z], 0.6);
  }
  const letter = pickIndex(r, 8);
  return [
    SHOP[0] - 0.42 + letter * 0.12 + between(r, 0, 0.07),
    SIGN_Y + between(r, -0.04, 0.04),
    z,
  ];
};

/** Two rope handles over the bag's mouth, front and back. */
const HANDLES = [arc(0, 0, 1, 0, Math.PI, 12)];
const handles = (r: Random): Vec3 => {
  const z = BAG[2] + (r() < 0.5 ? -BAG_SIZE[2] / 3 : BAG_SIZE[2] / 3);
  return onDrawing(r, HANDLES, [BAG[0], BAG[1] + BAG_SIZE[1] / 2, z], 0.17);
};

/** The phone: its body, a search bar and a two-by-three grid of products. */
const PHONE_PATHS = [
  roundedRect(-0.55, -1, 0.55, 1, 0.14),
  roundedRect(-0.42, 0.62, 0.42, 0.8, 0.08),
  ...[-0.22, 0.22].flatMap((x) =>
    [0.3, -0.15, -0.6].map((y) => box(x - 0.17, y - 0.17, x + 0.17, y + 0.17))
  ),
];
const phone = (r: Random): Vec3 => onDrawing(r, PHONE_PATHS, PHONE, PHONE_SCALE);

export const RETAIL: IndustryLandmark = {
  parts: [
    {
      weight: 1.5,
      sample: (r) => onFacade(r, SHOP, 0.2, 0.2),
      order: rise(0.08, 0.24, GROUND, 1.2),
    },
    { weight: 0.9, sample: awning, order: () => 0.28 },
    { weight: 0.9, sample: shopfront, order: () => 0.32 },
    { weight: 0.35, sample: sign, order: () => 0.36 },
    { weight: 1.3, sample: (r) => onBox(r, BAG, BAG_SIZE), order: rise(0.3, 0.44, GROUND, 0.72) },
    { weight: 0.2, tag: 2, sample: handles, order: () => 0.48 },
    { weight: 0.6, tag: 1, sample: phone, order: () => 0.52 },
    ...PARCELS.map((at, i) => ({
      weight: 0.1,
      tag: 3,
      sample: (r: Random) => onBox(r, at, [0.22, 0.2, 0.2]),
      order: () => 0.56 + i * 0.02,
    })),
  ],
  draw: (lines) => {
    drawBlock(lines, SHOP, 0.08, 0.24);
    lines.path(
      [
        [SHOP_LEFT, AWNING_Y, SHOP_FRONT],
        [SHOP_LEFT, AWNING_Y - 0.16, SHOP_FRONT + 0.3],
        [SHOP_RIGHT, AWNING_Y - 0.16, SHOP_FRONT + 0.3],
        [SHOP_RIGHT, AWNING_Y, SHOP_FRONT],
      ],
      0.26,
      0.3
    );
    lines.box(BAG, BAG_SIZE, 0.3, 0.44);
    PARCELS.forEach((at, i) => lines.box(at, [0.22, 0.2, 0.2], 0.56 + i * 0.02, 0.58 + i * 0.02));
  },
  icons: ["search", "cart", "parcel", "route", "chart", "megaphone"],
  anchors: [
    [PHONE[0], PHONE[1] + 0.71 * PHONE_SCALE, PHONE[2]],
    [BAG[0], BAG[1] + BAG_SIZE[1] / 2 + 0.17, BAG[2]],
    [PARCELS[2][0], PARCELS[2][1] + 0.1, PARCELS[2][2]],
    [DOOR_X, GROUND + 0.4, SHOP_FRONT],
    [WINDOWS[0], GROUND + 0.5, SHOP_FRONT],
    [SHOP[0] + 0.4, SIGN_Y, SHOP_FRONT],
  ],
};

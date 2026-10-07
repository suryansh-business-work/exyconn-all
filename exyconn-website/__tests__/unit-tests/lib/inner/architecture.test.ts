import { describe, expect, it } from "vitest";
import {
  NODE_HEIGHT,
  VIEW_WIDTH,
  layoutArchitecture,
} from "../../../../src/lib/inner/architecture";

describe("architecture diagram layout", () => {
  const { layers, height } = layoutArchitecture([
    { label: "Channels", nodes: ["Web", "WhatsApp", "Email", "Voice"] },
    { label: "Core", nodes: ["Agent"] },
    { label: "Later", nodes: [] },
  ]);

  it("stacks one band per layer, top to bottom, each with its label above it", () => {
    expect(layers.map((layer) => [layer.key, layer.labelY, layer.top, layer.bottom])).toEqual([
      ["0-Channels", 20, 30, 110],
      ["1-Core", 152, 162, 198],
      ["2-Later", 240, 250, 286],
    ]);
    expect(height).toBe(294);
  });

  it("puts at most three nodes in a row, sharing the width between them", () => {
    const [first, second, third, fourth] = layers[0].nodes;
    const thirdWidth = (VIEW_WIDTH - 16 - 16) / 3;

    expect(first).toEqual({ key: "0-0", text: "Web", x: 8, y: 30, width: thirdWidth });
    expect(second.x).toBeCloseTo(8 + thirdWidth + 8);
    expect(third.x).toBeCloseTo(8 + 2 * (thirdWidth + 8));
    expect(fourth).toEqual({
      key: "0-3",
      text: "Voice",
      x: 8,
      y: 30 + NODE_HEIGHT + 8,
      width: 344,
    });
  });

  it("gives a lone node the full width and keeps a row's height for an empty layer", () => {
    expect(layers[1].nodes).toEqual([{ key: "1-0", text: "Agent", x: 8, y: 162, width: 344 }]);
    expect(layers[2].nodes).toEqual([]);
    expect(layers[2].bottom - layers[2].top).toBe(NODE_HEIGHT);
  });
});

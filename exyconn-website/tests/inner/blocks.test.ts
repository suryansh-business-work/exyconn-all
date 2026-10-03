import { describe, expect, it } from "vitest";
import { layoutArchitecture, NODE_HEIGHT, VIEW_WIDTH } from "../../src/lib/inner/architecture";
import { slugify, withHeadingIds } from "../../src/lib/inner/headings";
import { breadcrumbJsonLd, faqJsonLd } from "../../src/lib/inner/structured-data";
import { countFrame, easeOut } from "../../src/scripts/inner/counters";
import {
  compareValues,
  fillCount,
  matches,
  parseSort,
  readState,
  writeQuery,
} from "../../src/scripts/inner/filter";
import { stepState, stepText } from "../../src/scripts/inner/form-step";
import { progressThrough } from "../../src/scripts/inner/toc";

describe("architecture layout", () => {
  it("bands layers top to bottom with at most three nodes a row", () => {
    const { layers, height } = layoutArchitecture([
      { label: "Channels", nodes: ["Web", "WhatsApp"] },
      { label: "Tools", nodes: ["CRM", "Calendar", "Email", "Docs"] },
      { label: "Empty", nodes: [] },
    ]);
    expect(layers[0].nodes[1].x + layers[0].nodes[1].width).toBeCloseTo(VIEW_WIDTH - 8);
    expect(layers[1].nodes[3].y).toBe(layers[1].nodes[0].y + NODE_HEIGHT + 8);
    expect(layers[1].nodes[3].width).toBeCloseTo(VIEW_WIDTH - 16);
    expect(layers[1].top).toBeGreaterThan(layers[0].bottom);
    expect(layers[2].bottom - layers[2].top).toBe(NODE_HEIGHT);
    expect(height).toBe(layers[2].bottom + 8);
    expect(new Set(layers.flatMap((layer) => layer.nodes.map((node) => node.key))).size).toBe(6);
  });
});

describe("article headings", () => {
  it("adds unique ids to h2/h3 and lists them, keeping ids already there", () => {
    const { html, toc } = withHeadingIds(
      '<h2>Why &amp; how</h2><p>x</p><h3 class="a">Café <em>notes</em></h3><h2>Why &amp; how</h2><h2 id="keep">Kept</h2><h4>Skip</h4><h2>!!!</h2>'
    );
    expect(toc).toEqual([
      { id: "why-how", label: "Why & how", level: 2 },
      { id: "cafe-notes", label: "Café notes", level: 3 },
      { id: "why-how-2", label: "Why & how", level: 2 },
      { id: "keep", label: "Kept", level: 2 },
      { id: "section", label: "!!!", level: 2 },
    ]);
    expect(html).toContain('<h3 id="cafe-notes" class="a">');
    expect(html).toContain('<h2 id="keep">Kept</h2>');
    expect(html).toContain("<h4>Skip</h4>");
    expect(slugify("  Hello, World  ")).toBe("hello-world");
  });
});

describe("structured data", () => {
  it("publishes FAQ answers and absolute breadcrumb items", () => {
    expect(faqJsonLd([{ question: "Q?", answer: "A." }]).mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Q?",
      acceptedAnswer: { "@type": "Answer", text: "A." },
    });
    const crumbs = breadcrumbJsonLd(
      [
        { label: "AI", href: "/ai" },
        { label: "Docs", href: "https://docs.example.com/x" },
        { label: "Agents" },
      ],
      "https://exyconn.com/"
    ).itemListElement;
    expect(crumbs[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "AI",
      item: "https://exyconn.com/ai",
    });
    expect(crumbs[1].item).toBe("https://docs.example.com/x");
    expect(crumbs[2]).not.toHaveProperty("item");
  });
});

describe("counters", () => {
  it("counts the first number up and keeps its format", () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(2)).toBe(1);
    expect(countFrame("99.9%", 1)).toBe("99.9%");
    expect(countFrame("99.9%", 0)).toBe("0.0%");
    expect(countFrame("1,200+ clients", 1)).toBe("1,200+ clients");
    expect(countFrame("1 Week", 0)).toBe("0 Week");
    expect(countFrame("No number", 0.5)).toBe("No number");
  });
});

describe("filter rules", () => {
  const item = { values: { cat: ["ai", "voice"] }, text: "Voice agent for clinics" };

  it("reads and writes the query, dropping empty values", () => {
    expect(readState("?cat=ai&q=%20voice%20&x=1", ["cat", "q", "sort"])).toEqual({
      cat: "ai",
      q: "voice",
      sort: "",
    });
    expect(writeQuery("?x=1&cat=web", { cat: "", q: "agent" })).toBe("?x=1&q=agent");
    expect(writeQuery("?cat=web", { cat: "" })).toBe("");
  });

  it("matches chips and every search term", () => {
    expect(matches(item, { cat: "ai", q: "clinic VOICE" }, ["cat"], "q")).toBe(true);
    expect(matches(item, { cat: "web" }, ["cat"], "q")).toBe(false);
    expect(matches(item, { cat: "", q: "dental" }, ["cat"], "q")).toBe(false);
    expect(matches(item, {}, ["cat", "region"])).toBe(true);
    expect(matches(item, { region: "eu" }, ["region"])).toBe(false);
  });

  it("sorts numbers as numbers, text as text, missing last", () => {
    expect(parseSort("-date")).toEqual({ key: "date", direction: -1 });
    expect(parseSort("name")).toEqual({ key: "name", direction: 1 });
    expect(compareValues("9", "10")).toBeLessThan(0);
    expect(compareValues("b", "a")).toBeGreaterThan(0);
    expect(compareValues("", "1")).toBeLessThan(0);
    expect(compareValues(undefined, "a")).toBe(1);
    expect(compareValues("a", undefined)).toBe(-1);
    expect(compareValues(undefined, undefined)).toBe(0);
    expect(fillCount("{shown} of {total}", 3, 9)).toBe("3 of 9");
  });
});

describe("form steps and reading progress", () => {
  it("phrases the step and marks done/current/todo", () => {
    expect(stepText("Step {current} of {total}", 1, 4)).toBe("Step 2 of 4");
    expect(stepText("{current}/{total}", 9, 4)).toBe("4/4");
    expect(stepText("{current}/{total}", -3, 4)).toBe("1/4");
    expect([0, 1, 2].map((step) => stepState(step, 1))).toEqual(["done", "current", "todo"]);
  });

  it("fills from 0 to 1 as the target scrolls through", () => {
    expect(progressThrough(100, 2000, 800)).toBe(0);
    expect(progressThrough(-600, 2000, 800)).toBeCloseTo(0.5);
    expect(progressThrough(-5000, 2000, 800)).toBe(1);
    expect(progressThrough(-10, 500, 800)).toBe(1);
    expect(progressThrough(10, 500, 800)).toBe(0);
  });
});

/**
 * The workspace's own web accessibility rules — the violations axe finds at runtime, caught in
 * source so that screens without a component spec are held to WCAG 2.2 AA too.
 *
 * jsx-a11y only knows DOM elements; these know the design system's components:
 *
 * - `icon-button-has-name` (SC 4.1.2) — an `IconButton` or `Fab` has no text of its own, so it
 *   needs `aria-label`, `aria-labelledby` or `title`, or a string `title` on the `Tooltip`
 *   wrapping it (MUI names the child from that).
 * - `tooltip-child-focusable` (SC 1.4.13, 2.1.1) — a `Tooltip` opens on hover AND focus; around
 *   something a keyboard cannot focus (an Avatar, an icon, a Typography) its content is
 *   mouse-only.
 * - `text-field-has-label` (SC 1.3.1, 3.3.2) — a `TextField` needs a `label`, or an
 *   `aria-label`/`aria-labelledby` passed down to its input.
 */

const NAME_ATTRIBUTES = new Set(["aria-label", "aria-labelledby", "title"]);
const ICON_ONLY = new Set(["IconButton", "Fab"]);

/** Elements a keyboard can reach, as a Tooltip's direct child. */
const FOCUSABLE = new Set([
  "Button",
  "IconButton",
  "Fab",
  "ToggleButton",
  "Link",
  "MenuItem",
  "Checkbox",
  "Switch",
  "Radio",
  "TextField",
  "Tab",
  "ListItemButton",
  "CardActionArea",
  "button",
  "a",
  "input",
  "select",
  "textarea",
]);

function elementName(opening) {
  const { name } = opening;
  if (name.type === "JSXIdentifier") {
    return name.name;
  }
  if (name.type === "JSXMemberExpression") {
    return name.property.name;
  }
  return null;
}

function attributeMap(opening) {
  const map = new Map();
  let spread = false;
  for (const attribute of opening.attributes) {
    if (attribute.type === "JSXSpreadAttribute") {
      spread = true;
    } else if (attribute.name.type === "JSXIdentifier") {
      map.set(attribute.name.name, attribute);
    }
  }
  return { map, spread };
}

/** The nearest enclosing JSX element, looking through `{cond && …}` and fragments' wrappers. */
function parentElement(element) {
  let current = element.parent;
  while (current && current.type !== "JSXElement") {
    if (
      current.type === "Program" ||
      current.type.endsWith("Function") ||
      current.type === "ArrowFunctionExpression"
    ) {
      return null;
    }
    current = current.parent;
  }
  return current ?? null;
}

/** The first JSX element among a Tooltip's children, ignoring whitespace. */
function firstChildElement(element) {
  for (const child of element.children) {
    if (child.type === "JSXElement") {
      return child;
    }
    if (child.type === "JSXText" && child.value.trim() === "") {
      continue;
    }
    // An expression child (`{children}`, a conditional) — cannot be judged statically.
    return undefined;
  }
  return undefined;
}

/** True when the attribute's source text mentions an ARIA name — `slotProps={{ htmlInput: { 'aria-label' … } }}`. */
function mentionsAriaName(context, attribute) {
  const text = context.sourceCode.getText(attribute);
  return /aria-label(ledby)?/.test(text);
}

function isFocusable(childElement) {
  const opening = childElement.openingElement;
  const name = elementName(opening);
  const { map, spread } = attributeMap(opening);
  if (
    spread ||
    map.has("tabIndex") ||
    map.has("onClick") ||
    map.has("component")
  ) {
    return true;
  }
  if (name && FOCUSABLE.has(name)) {
    return true;
  }
  // `<span><Button disabled /></span>` — MUI's documented pattern for a tooltip on a disabled
  // control. Only a bare span: a Box is judged on its own props like any other element.
  if (name === "span") {
    const inner = firstChildElement(childElement);
    return inner === undefined || isFocusable(inner);
  }
  return false;
}

const iconButtonHasName = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Icon-only buttons need an accessible name (WCAG 2.2 SC 4.1.2).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(opening) {
        const name = elementName(opening);
        if (!name || !ICON_ONLY.has(name)) {
          return;
        }
        const { map, spread } = attributeMap(opening);
        if (
          spread ||
          [...NAME_ATTRIBUTES].some((attribute) => map.has(attribute))
        ) {
          return;
        }
        const parent = parentElement(opening.parent);
        if (parent && elementName(parent.openingElement) === "Tooltip") {
          const title = attributeMap(parent.openingElement).map.get("title");
          if (title) {
            return;
          }
        }
        context.report({
          node: opening,
          message: `<${name}> has no accessible name: give it an aria-label (translated), or wrap it in a Tooltip with a title.`,
        });
      },
    };
  },
};

const tooltipChildFocusable = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A Tooltip must wrap something a keyboard can focus (WCAG 2.2 SC 1.4.13).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXElement(element) {
        if (elementName(element.openingElement) !== "Tooltip") {
          return;
        }
        const child = firstChildElement(element);
        if (child === undefined || isFocusable(child)) {
          return;
        }
        context.report({
          node: child.openingElement,
          message: `A Tooltip around <${elementName(child.openingElement)}> only opens on hover — a keyboard cannot reach it. Give the child tabIndex={0}, or put the tooltip on a focusable control.`,
        });
      },
    };
  },
};

const textFieldHasLabel = {
  meta: {
    type: "problem",
    docs: {
      description: "A TextField needs a label (WCAG 2.2 SC 1.3.1, 3.3.2).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(opening) {
        if (elementName(opening) !== "TextField") {
          return;
        }
        const { map, spread } = attributeMap(opening);
        if (
          spread ||
          map.has("label") ||
          map.has("aria-label") ||
          map.has("aria-labelledby")
        ) {
          return;
        }
        for (const prop of ["slotProps", "inputProps", "InputProps"]) {
          const attribute = map.get(prop);
          if (attribute && mentionsAriaName(context, attribute)) {
            return;
          }
        }
        context.report({
          node: opening,
          message:
            "<TextField> has no label: give it `label`, or an aria-label via slotProps.htmlInput.",
        });
      },
    };
  },
};

export const exyconnWebA11y = {
  rules: {
    "icon-button-has-name": iconButtonHasName,
    "tooltip-child-focusable": tooltipChildFocusable,
    "text-field-has-label": textFieldHasLabel,
  },
};

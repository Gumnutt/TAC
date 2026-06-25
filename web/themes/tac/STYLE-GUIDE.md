# TAC CSS Methodology — Rules & Guidelines

> **TAC** stands for **Tag, Attributes, Classes** — a modern CSS methodology designed for the Web Components era. Style elements in that order, using only web standards: no build steps, no proprietary syntax, no dependencies.

---

## Core Philosophy

- The web platform (HTML, CSS, JavaScript) is the framework.
- Components should be meaningful HTML elements, not `div` soup with classes.
- Prefer CSS over JavaScript. Only add JavaScript when CSS cannot do the job.
- Nothing proprietary. Everything must work in a plain browser with no tooling.

---

## Rule 1 — Tag First

**Style the element by its HTML tag before doing anything else.**

Use standard HTML tags wherever they exist. Only invent a custom tag when no native element fits the concept.

```css
/* Good — native tag */
button { ... }
details { ... }

/* Good — custom tag for a genuinely new component */
x-badge { ... }
x-accordion { ... }
```

### Rules

- **Always prefer a native HTML tag** (`button`, `details`, `dialog`, `nav`, etc.) over a custom one.
- **Custom tags must use a namespace prefix** (e.g. `x-`, `m-`, or your project's prefix) to avoid collisions with future HTML elements.
- The tag name should be a clear, readable noun that describes the component (`x-badge`, `x-card`, `x-alert`).
- Never use a `div` or `span` as a component tag. If the element needs a name, give it a real tag.
- The base tag styles define the component's **default, unstyled appearance** — the baseline every instance shares.

---

## Rule 2 — Attributes Second

**Use HTML attributes to define variants and states of a component.**

Attributes create a semantic, self-documenting API for a component — exactly like native HTML (`disabled`, `checked`, `type="submit"`).

```css
/* Boolean attribute — presence toggles a style */
x-badge[hidden] {
  display: none;
}

/* Value attribute — value drives the style */
x-badge[count] {
  /* show the badge */
}

x-alert[type="warning"] {
  background-color: var(--x-colour-warning);
}

x-alert[type="error"] {
  background-color: var(--x-colour-error);
}
```

### Rules

- **Use attributes for variants and states**, not additional classes (e.g. `[type="primary"]`, `[size="lg"]`, `[disabled]`, `[open]`).
- Attribute names should be lowercase, hyphenated, and descriptive (`count`, `ord`, `nav-item`).
- **Boolean attributes** (presence = true, absence = false) are preferred for simple on/off states.
- **Value attributes** are used when a variant has multiple named options.
- Avoid inventing attributes that duplicate existing HTML attributes (use `disabled`, `hidden`, `open` where they already exist natively).
- Attribute-based variants are the component's **public API** — keep them stable and intentional.
- Do not use attributes for layout or spacing concerns — that belongs to utility classes.

---

## Rule 3 — Classes Last

**Use utility classes for customisation, layout, and one-off overrides.**

Classes are the escape hatch. They are not the primary styling mechanism in TAC — they handle the things that vary from one use of a component to the next.

```html
<!-- Utility classes handle spacing, not the component itself -->
<x-badge count="3" class="mar-r-sm"></x-badge>

<!-- Layout adjustments via utility -->
<x-alert type="warning" class="pad-lg mar-b-md"></x-alert>
```

```css
/* Utility classes are small, single-purpose, design-token-driven */
.mar-r-sm  { margin-right: var(--x-space-sm); }
.pad-lg    { padding: var(--x-space-lg); }
.txt-bold  { font-weight: var(--x-font-weight-bold); }
```

### Rules

- Classes should be **utility-only** — single responsibility, named by what they do.
- Utility classes must use **design tokens** (CSS custom properties), never hard-coded values.
- Class names should be short and predictable, following a consistent naming pattern (e.g. `[property]-[value]` or `[property]-[size]`).
- **Never use a class to create a component variant** — that is the job of attributes.
- Never recreate a component's base styles via class; extend or adjust only.
- Utility classes are **shared** across components. Do not create single-use classes tied to one component.

---

## Rule 4 — Design Tokens are Mandatory

**All values (colours, spacing, typography, radii, shadows) must be defined as CSS Custom Properties.**

Design tokens are the single source of truth for the visual language. Both components and utility classes reference the same tokens.

```css
:root {
  /* Colours */
  --x-colour-primary:   #0066cc;
  --x-colour-warning:   #f0a500;
  --x-colour-error:     #d93025;
  --x-colour-surface:   #ffffff;

  /* Spacing */
  --x-space-xs:  4px;
  --x-space-sm:  8px;
  --x-space-md:  16px;
  --x-space-lg:  24px;
  --x-space-xl:  40px;

  /* Typography */
  --x-font-size-sm:     0.875rem;
  --x-font-size-md:     1rem;
  --x-font-size-lg:     1.25rem;
  --x-font-weight-bold: 700;

  /* Radii */
  --x-radius-sm: 4px;
  --x-radius-md: 8px;
}
```

### Rules

- **Never hard-code a design value** in a component or utility class. Always reference a token.
- All tokens must be **namespaced** with the project prefix (e.g. `--x-`, `--myapp-`) to avoid collisions.
- Tokens must be defined on `:root` so they are globally available.
- Token names should follow the pattern `--[prefix]-[category]-[variant]` (e.g. `--tac-colour-primary`, `--tac-space-lg`).
- Both component tag styles and utility classes must share the **same token set**.

---

## Rule 5 — Tag-to-JavaScript Upgrade Path

**Start with CSS only. Add JavaScript only when CSS cannot achieve the behaviour.**

TAC is designed so a CSS-only component can be upgraded to a Custom Element without changing its HTML API.

```js
// The HTML doesn't change — the tag and attributes are the same API
customElements.define('x-badge', class extends HTMLElement {
  static get observedAttributes() { return ['count']; }

  attributeChangedCallback(name, oldVal, newVal) {
    // React to attribute changes with JS behaviour
  }
});
```

### Rules

- Write CSS-only first. Only introduce a Custom Elements definition when interactivity is genuinely needed.
- The Custom Element must **not change** the tag name, attribute names, or their meaning — the CSS API is the contract.
- JavaScript should **enhance** behaviour, never replace CSS styling logic.
- Avoid putting styles inside JavaScript (no `style.foo =`). Keep styles in CSS.

---

## Rule 6 — Selector Discipline

**Keep selectors simple, flat, and grounded in the tag.**

```css
/* Good */
x-card { ... }
x-card[elevated] { ... }
x-card .title { ... }

/* Avoid — high specificity, fragile */
.card-wrapper > div.card--elevated span.title { ... }
```

### Rules

- Selectors should almost always start with the component **tag** (e.g. `x-alert`, `button`, `details`).
- Avoid deep nesting. Maximum two levels of descendant selectors within a component.
- Never use `!important` to override component styles — redesign the token or attribute instead.
- Avoid ID selectors in component styles.
- Specificity should be **low and predictable**. Utility classes may need slightly higher specificity than base tag styles to ensure they can override when applied.

---

## Rule 7 — File & Scope Organisation

**Organise CSS around tags (components), not around pages or features.**

```
styles/
  tokens.css          ← all CSS custom properties
  reset.css           ← optional base reset
  components/
    x-badge.css
    x-alert.css
    x-card.css
  utilities/
    spacing.css
    typography.css
    display.css
  global.css          ← styles for native tags (p, a, h1–h6, etc.)
```

### Rules

- One file per component (named after its tag).
- Token definitions live in a single `tokens.css` (or equivalent) file, imported first.
- Utility classes live in their own files, grouped by concern.
- Global/base styles for native HTML elements (`p`, `a`, headings) are legitimate and expected — they are not an anti-pattern in TAC.
- Do not co-locate component CSS with JavaScript files unless the project is a full Custom Element (Web Component).

---

## Rule 8 — Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Custom tag | `[prefix]-[noun]` | `x-badge`, `x-alert` |
| Attribute (boolean) | lowercase noun/adjective | `disabled`, `elevated`, `open` |
| Attribute (value) | lowercase noun | `type="warning"`, `ord="primary"` |
| Design token | `--[prefix]-[category]-[variant]` | `--x-colour-warning` |
| Utility class | `[property abbreviation]-[value/size]` | `.mar-r-sm`, `.pad-lg`, `.txt-bold` |

---

## Quick Reference Checklist

When creating a new component, ask in order:

1. **Is there a native HTML tag for this?** Use it if yes.
2. **Does this need a custom tag?** Add a namespaced tag and write base styles.
3. **What variants/states does this component have?** Model each as an attribute.
4. **What customisation will consumers need?** Provide utility classes that use tokens.
5. **Does this need JavaScript?** Only add a Custom Element definition if CSS cannot do it.
6. **Are all values referencing tokens?** No hard-coded colours, spacing, or sizes.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why | TAC Alternative |
|---|---|---|
| `<div class="badge">` | Meaningless element | `<x-badge>` |
| `<x-badge class="badge--large">` | Variant via class | `<x-badge size="lg">` |
| `color: #0066cc` in a component | Hard-coded value | `color: var(--x-colour-primary)` |
| Deep class chains: `.card.card--elevated.card--dark` | Class soup | `x-card[elevated][theme="dark"]` |
| JavaScript toggling inline styles | Bypasses CSS | Toggle an attribute; let CSS respond |
| Writing CSS before checking for a native tag | Unnecessary custom work | Always check MDN first |

---

*Based on the TAC CSS methodology by Jordan Brennan. Reference implementation: [Mdash design system](http://m-docs.org).*
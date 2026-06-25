# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **TAC** custom Drupal 11 theme, part of a Composer-managed Drupal CMS 11.3+ installation. The theme is a completely blank starter following the **TAC CSS methodology** (Tag, Attributes, Classes) — a build-tool-free, web-standards-only approach.

The full Drupal project root is at `../../../../` (i.e. `drupal_tac/`). This theme lives at `web/themes/tac/`.

## Local Development Commands

All commands run from the **project root** (`drupal_tac/`), not this theme directory:

```bash
ddev start                          # Start the local environment
ddev launch                         # Open site in browser
ddev composer install               # Install PHP dependencies
ddev drush cache:rebuild            # Clear Drupal caches (required after theme changes)
ddev drush config:import --yes      # Import config from repo into the running site
ddev drush config:export --yes      # Export site config back to repo
ddev drush update:db --yes          # Run database updates after code changes
ddev drush user:login               # Get a one-time login link
```

Add a contributed module:
```bash
ddev composer require drupal/<project>
ddev drush pm:enable --yes <module_machine_name>
ddev drush cache:rebuild
```

## Architecture

The theme is intentionally minimal: no base theme, no build pipeline, no Node.js. Components are built using **Drupal's Single Directory Components (SDC)** system. All CSS is plain `.css` with no preprocessors.

**File structure:**
```
tac/
  tac.info.yml
  tac.libraries.yml         # global styles only (tokens, reset, utilities)
  components/               # SDC components — one directory per component
    badge/
      badge.component.yml
      badge.twig
      badge.css
    alert/
      alert.component.yml
      alert.twig
      alert.css
  styles/
    tokens.css              # all CSS custom properties (--x-* namespace)
    reset.css               # optional base reset
    global.css              # native tag styles (p, a, h1-h6, etc.)
    utilities/
      spacing.css
      typography.css
      display.css
  templates/                # Twig overrides for Drupal core/module templates
```

## Single Directory Components (SDC)

SDC is a Drupal core feature (available since Drupal 10.1). Each component is self-contained in its own directory under `components/`.

**Component anatomy:**

`badge.component.yml` — declares the component's props and slots:
```yaml
name: Badge
description: A badge component.
props:
  type: object
  properties:
    count:
      type: integer
    type:
      type: string
      enum: [default, warning, error]
slots:
  content:
    title: Content
```

`badge.twig` — the component template:
```twig
<tac-badge {{ attributes }} count="{{ count }}" type="{{ type }}">
  {{ content }}
</tac-badge>
```

`badge.css` — component-scoped styles following TAC methodology:
```css
tac-badge { ... }
tac-badge[type="warning"] { background: var(--x-colour-warning); }
```

**Using a component in Twig** (referenced as `themename:component-name`):
```twig
{% include 'tac:badge' with { count: 3, type: 'warning' } %}
```

**Key SDC behaviours:**
- SDC automatically loads a component's CSS/JS when the component is rendered — no manual `tac.libraries.yml` entry needed for component assets.
- Global styles (tokens, reset, utilities) still need to be declared in `tac.libraries.yml` and attached globally via `tac.info.yml` or a preprocess hook.
- Props are validated against the JSON Schema in `.component.yml` during development.
- The `attributes` variable is available in every SDC template for passing through Drupal's attribute object.

## TAC CSS Methodology

The STYLE-GUIDE.md in this directory is the authoritative reference. Key rules:

**Order of styling: Tag → Attribute → Class**

1. **Tag first** — style the HTML element tag; use native tags where they exist; use namespaced custom tags (e.g. `tac-badge`) only when no native element fits
2. **Attributes second** — variants and states are expressed as HTML attributes (`[type="warning"]`, `[disabled]`, `[elevated]`), not modifier classes
3. **Classes last** — utility classes only, single-purpose, always referencing a design token

**Design tokens are mandatory** — all colours, spacing, and typography values must be CSS custom properties on `:root` using the `--tac-` prefix (e.g. `--tac-colour-primary`, `--tac-space-md`). No hard-coded values anywhere.

**New component checklist:**
1. Is there a native HTML tag? Use it.
2. Need a custom tag? Use `tac-[noun]` and write base tag styles.
3. Model variants as attributes, not classes.
4. Customisation via utility classes that reference tokens.
5. Add a Custom Element JS definition only if CSS cannot achieve the behaviour.

**Anti-patterns to avoid:**
- `<div class="badge">` — use `<tac-badge>` instead
- Variant via class (`class="badge--large"`) — use `size="lg"` attribute instead
- Hard-coded values — always use `var(--tac-colour-*)`, `var(--tac-space-*)` etc.
- `!important` — redesign the token or attribute instead

## Guardrails

- Do not edit Drupal core or any contributed project files.
- Custom code belongs in `web/modules/custom/` and `web/themes/custom/` (this theme is effectively the custom theme location).
- Do not commit `vendor/`, `web/sites/*/files`, `.env`, `settings.local.php`, or `.ddev/config.local.yaml`.
- The `core/normalize` library is explicitly disabled in `tac.info.yml` — do not re-enable it.

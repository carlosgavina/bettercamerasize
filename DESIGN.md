---
version: alpha
name: Better Camera Size Dark Precision System
description: Shared visual direction for the public comparison app and the internal Studio, inspired by dark structured-content tooling.
colors:
  canvas: "#0B0B0B"
  surface: "#151515"
  surface-raised: "#212121"
  border: "#353535"
  text-primary: "#FFFFFF"
  text-secondary: "#B9B9B9"
  text-muted: "#797979"
  accent-blue: "#0052EF"
  accent-coral: "#F36458"
  success: "#37CD84"
  danger: "#DD0000"
typography:
  display:
    fontFamily: "Manrope"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: 0
  headline:
    fontFamily: "Manrope"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: 0
  body:
    fontFamily: "Manrope"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  label:
    fontFamily: "IBM Plex Sans"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
rounded:
  input: 3px
  control: 5px
  panel: 6px
  overlay: 12px
  pill: 99999px
spacing:
  hairline: 1px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.control}"
    hoverBackgroundColor: "{colors.accent-blue}"
    hoverTextColor: "{colors.text-primary}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
  input-default:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-secondary}"
    borderColor: "{colors.surface-raised}"
    rounded: "{rounded.input}"
  panel-default:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.panel}"
---

## Overview

Better Camera Size should feel like a precise instrument panel for physical comparison.
The visual system uses a near-black canvas, pure grayscale surfaces, compact controls, and vivid accent states. Product imagery and measured compatibility remain the focus; the interface should feel structured, fast, and technically credible.

The public app and Studio share the same foundation, but not the same density:

- The public app can use larger staging, more atmosphere, and more visual drama around comparison scenes.
- Studio should feel like a dark operations console: dense, direct, and designed for repeated catalog work.

## Color Rules

Use an achromatic dark palette as the primary identity:

- `#0B0B0B` is the canvas.
- `#151515` and `#212121` are working surfaces.
- `#353535` is the main separator and containment color.
- `#FFFFFF`, `#B9B9B9`, and `#797979` form the text hierarchy.
- `#0052EF` is the consistent hover/focus/active signal.
- `#F36458` is reserved for rare high-emphasis action moments.

Avoid warm beige surfaces, purple gradients, glass effects, and decorative backgrounds in Studio.

## Typography Rules

Use compact sans-serif typography for product and catalog work.

- Studio headings should be compact and functional.
- Labels and metadata should use the technical font register.
- Letter spacing in implementation should stay neutral.
- Body text should be readable at operational density.

The referenced Sanity design uses a custom display face and aggressive negative tracking. We are not adopting those exact details because our UI must remain practical, stable, and compatible with project layout guardrails.

## Layout Rules

Studio is an application shell, not a marketing page.

- Use a persistent left sidebar.
- Each route has a compact top bar.
- Resource pages use list/detail panes.
- Panes fill available height and scroll internally.
- Add/create flows open in modals.
- Use separators and tonal surfaces instead of stacked cards.

The public comparison app should still protect a large visual stage for camera/lens scale rendering.

## Component Rules

Controls should be systematic and quiet:

- Inputs: near-black background, subtle border, small radius.
- Buttons: compact, direct, and high contrast.
- Primary actions may use white-on-dark or blue hover states.
- Dialogs: dense, scrollable, with clear footer actions.
- Lists: row-based with separators, not card grids.
- Details: large working pane with section dividers.

## Asset And Renderer Rules

Product imagery must remain visually inspectable:

- Do not bury images in decorative frames.
- Avoid heavy shadows or effects around cutouts.
- Use dark surfaces that let transparent PNG/WebP boundaries remain readable.
- Calibration metadata, hood state, and view state should be visible in Studio review flows.

## Do And Do Not

- Do make Studio feel like a professional catalog operations app.
- Do use full-height panes and internal scrolling.
- Do keep interaction states consistent and obvious.
- Do use blue as the active/focus signal.
- Do preserve high contrast.
- Do not use oversized cards for page sections.
- Do not make the admin feel like a landing page.
- Do not use warm neutral themes in Studio.
- Do not add decorative gradients, blurred blobs, or generic SaaS chrome.

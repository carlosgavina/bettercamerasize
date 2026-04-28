---
version: alpha
name: Better Camera Size Foundation
description: Shared visual foundation for the public comparison app and the internal studio app.
colors:
  primary: "#111315"
  secondary: "#5B636B"
  tertiary: "#C96B2C"
  neutral: "#F5F2EC"
  surface: "#FFFDF9"
  surface-muted: "#ECE7DF"
  on-surface: "#17191B"
  border: "#D6CEC3"
  success: "#2F6B53"
  danger: "#9C3A2D"
typography:
  display-lg:
    fontFamily: "Instrument Serif"
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: -0.02em
  headline-md:
    fontFamily: "Manrope"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  body-md:
    fontFamily: "Manrope"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.55
  label-sm:
    fontFamily: "IBM Plex Sans"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.08em
rounded:
  sm: 6px
  md: 12px
  lg: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  stage-gap: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 12px
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 12px
---

## Overview

Better Camera Size should feel precise, editorial, and mechanically trustworthy.

This is not a glossy gadget storefront. It is a measurement-oriented product where the visual layer has to support trust in scale, compatibility, and detail. The UI should feel modern and intentional, but not ornamental for its own sake.

The public app and the studio app share the same foundational language:

- high-contrast typography
- warm neutrals instead of sterile pure white
- restrained accent usage
- strong emphasis on image stage clarity
- dense information without cramped layout

The two app surfaces should diverge in tone:

- the public app may be more expressive and atmospheric
- the studio app should be quieter, denser, and more operational

## Colors

The palette is built around warm neutrals, dark ink tones, and a single copper accent.

- **Primary:** Use for the main text, key controls, and strong framing elements.
- **Secondary:** Use for metadata, dividers, and less prominent supporting text.
- **Tertiary:** Use sparingly for the most important actions, focused states, and notable callouts.
- **Neutral and Surface:** Use to keep the UI calm and photographic assets readable without the coldness of pure grayscale.
- **Border:** Use for separators and input boundaries instead of heavy shadows.

The accent color should not dominate the interface. Product imagery and relative scale are the focus, not the chrome around them.

## Typography

Typography should balance measurement precision with editorial quality.

- **Display:** Serif display type is allowed only for large landing moments, headings, and hero statements in the public app.
- **Headlines and body:** Sans-serif should carry most product UI, search results, filters, and data-heavy surfaces.
- **Labels:** Labels, dimensions, and micro-metadata should feel instrument-like and compact.

Readability matters more than typographic novelty. The studio app should bias toward speed and scanning.

## Layout

Layouts should be built around a clean stage-and-panel model.

- Comparison scenes need generous protected space around the products.
- Filters, selectors, and metadata should live in predictable side or lower panels instead of floating arbitrarily.
- Mobile layouts should prioritize vertical flow and deliberate sectional collapse instead of miniature desktop replicas.
- Use the spacing scale consistently; if a layout exception appears repeatedly, it should become a named token or component rule.

## Elevation & Depth

Depth should come from tonal contrast, borders, and layering before shadows.

Use soft elevation for overlays, floating controls, and dialogs, but avoid shadow-heavy interfaces. The comparison stage should remain visually crisp and flat enough that object boundaries and scale feel reliable.

## Shapes

The shape language should feel engineered, not bubbly.

- Inputs and utility surfaces use small to medium radius.
- Larger cards may use the medium radius for a softer, contemporary feel.
- Primary actions can be pill-shaped when they benefit from a strong, singular call-to-action treatment.

Do not mix sharp and very rounded surfaces randomly.

## Components

Components should feel systematic and quiet.

- Buttons should be bold but not oversized.
- Cards should frame controls and metadata without competing with the comparison stage.
- Inputs should read as instrument panels more than marketing forms.
- Dialogs and drawers should feel dense and operational, especially in studio.

The comparison renderer itself is not a generic card grid. It is a specialized stage and should be treated as a product-specific visual system with its own stricter layout rules.

## Do's and Don'ts

- Do keep the product imagery as the visual focal point.
- Do use the accent color sparingly and semantically.
- Do preserve strong contrast and information hierarchy.
- Do let the public app feel more expressive than the studio app.
- Don't make the studio app look like a marketing site.
- Don't rely on generic SaaS gradients or purple-on-white defaults.
- Don't use oversized shadows, glassmorphism, or decorative effects that weaken measurement trust.
- Don't crowd the comparison stage with unnecessary interface chrome.

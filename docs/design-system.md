# Design System Notes

## Recommendation

Adopt the `DESIGN.md` pattern, but use it lightly and deliberately.

Why it is useful here:

- it gives coding agents a stable design brief in plain text
- it keeps design intent close to the repo instead of buried in prompts
- it fits our plan for shared tokens with app-specific presentation

Why we should not overcommit to it:

- the upstream `google-labs-code/design.md` format is currently marked `alpha`
- our real implementation source of truth will eventually be code-level theme tokens
- one design file cannot replace design judgment, renderer constraints, or review

## How We Should Use It

For this repo, `DESIGN.md` should act as:

- a shared visual foundation
- an agent-readable design brief
- a planning artifact for token naming and component intent

It should not yet be treated as:

- the sole implementation source of truth
- a complete design system
- a substitute for app-level visual review

## Recommended Layering

1. `DESIGN.md`
   Defines shared visual identity, tokens, and high-level component intent.

2. `packages/theme`
   Future code-level token implementation for Tailwind, CSS variables, and app themes.

3. `packages/ui`
   Future shared primitives and composable UI components.

4. `apps/web` and `apps/studio`
   App-specific composition, density, and interaction design.

## Current Direction

We are adopting the dark precision direction captured in `DESIGN.md`.

The practical interpretation is:

- near-black canvas as the default product and Studio environment
- pure grayscale surfaces and separators
- compact app-shell layouts for Studio
- blue as the consistent focus, hover, and active signal
- coral/red only for rare high-emphasis or destructive moments
- list/detail pages and modal create flows for Studio resources

The reference design uses a custom typeface and aggressive negative tracking. We are not adopting those exact typographic details; implementation should keep letter spacing neutral for layout stability and readability.

## Shared Foundation, Different Surfaces

The public app and the studio app should not be visually identical.

Recommended split:

- shared typography families, color semantics, spacing rhythm, and shape language
- public app is more expressive and atmospheric
- studio app is denser, calmer, and more operational

If the two surfaces diverge substantially later, add app-specific `DESIGN.md` files while keeping the shared one as the base contract.

## Why We Adopted It

The useful parts of the upstream approach are:

- YAML tokens plus prose rationale
- canonical section structure
- explicit component intent
- lintable and diffable design artifacts

The parts we are intentionally not adopting yet are:

- deep tooling dependence on the format
- assuming the spec is stable
- over-modeling every component before the product exists

## Practical Rule

When design decisions become stable and repeated, promote them into `DESIGN.md`.

When implementation tokens become real, mirror them into code and keep the two aligned.

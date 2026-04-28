# Engineering Guardrails

Project-specific engineering guardrails for Better Camera Size.

This document is intentionally short. It exists to capture repeated lessons and stable working rules for both humans and coding agents.

## 1. Build Trustworthy Foundations First

This project is only as good as its catalog quality, compatibility logic, and calibrated assets.

- prefer data correctness over UI flourish
- prefer explicit compatibility modeling over inference
- prefer reviewable asset processing over opaque magic

If a tradeoff appears between speed and catalog trust, bias toward trust.

## 2. Prefer Stable Local Infrastructure Rules

Local development should be deterministic.

- keep a canonical local port map in the repo
- avoid ad hoc port changes
- do not hardcode local backend URLs into app code
- prefer one documented startup path over improvisation

The system must be testable locally before deployment becomes part of the workflow.

## 3. Reuse Before Adding

Before creating a new component, helper, token, or service:

1. look for an existing primitive
2. check whether the gap is really just a missing prop, token, or variant
3. add a new abstraction only when the difference is structural

Default ladder:

- existing shared primitive
- app-level wrapper
- new shared primitive only when multiple consumers truly need it

## 4. Parent Owns Layout

Reusable children should not silently own page layout.

Parents define:

- grid and columns
- spacing and insets
- responsive behavior
- alignment between siblings

Children define:

- content
- semantics
- local visual behavior

This matters especially for search rows, inspector panels, cards, and comparison control groups.

## 5. Do Not Guess Contracts

Before changing database, API, event, or storage behavior:

- inspect the actual schema or contract
- verify field names from the source of truth
- check adjacent patterns before inventing a new one

Confident guessing is one of the fastest ways to poison catalog integrity.

## 6. Make Compatibility Explicit

Do not hide compatibility behavior in string conventions or UI-only logic.

- mount relationships belong in the data model
- adapter chains must be queryable and reviewable
- compatibility shims need a reason and an exit path

If something is "temporarily supported", document what removes the temporary rule.

## 7. Keep Source Data Separate From Published Data

Automation should not write straight into the trusted catalog.

- raw fetches belong in ingest tables
- extracted facts belong in observed facts
- reviewed values become catalog truth

This separation is required for re-runs, audits, and conflict review.

## 8. Security Defaults Must Be Intentional

- keep secrets in environment variables or secret managers
- validate authorization server-side
- sanitize external input at boundaries
- prefer least privilege for service tokens and database roles

This applies to crawl jobs, storage access, internal tools, and any future community submission flows.

## 9. Verify Narrowly But Realistically

Do not stop at "the code looks right".

Run the narrowest useful verification for the change:

- schema or migration checks
- targeted package build
- relevant route or endpoint test
- runtime UI verification at touched breakpoints
- comparison preview validation when render logic changes

If a change can fail visually and logically, test both.

## 10. Prefer Small Operational Entry Points

Repeated workflows should become scripts or documented commands.

Strong candidates:

- app startup
- worker startup
- seed data loading
- asset pipeline tasks
- health checks
- verification routines

Local improvisation is the enemy of repeatable debugging.

## 11. Keep Docs In The Same Change Loop

When changing architecture, startup flow, contracts, or workflow:

- update the relevant docs in the same session
- prefer one source of truth over drifting notes

The repo should accumulate stable lessons, not force people to recover them from chat history.

## 12. Optimize For Surgical Changes

- solve the requested problem with the minimum credible change
- do not refactor unrelated areas opportunistically
- match the surrounding style unless there is a concrete reason not to
- clean up only the mess introduced by your own change unless explicitly asked

## 13. Use Goal-Driven Execution

Turn work into small verifiable outcomes.

Examples:

- "add body mount support" means a known body resolves expected lens chains
- "fix image qualification" means a labeled fixture set classifies correctly
- "improve studio form UX" means the edited flow is exercised in the real UI

Strong success criteria keep the project moving without speculative work.

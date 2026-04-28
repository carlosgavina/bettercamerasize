# Kickoff Decisions

These are the currently locked decisions for the first implementation phase.

## First Milestone

Build:

- `apps/studio`
- internal comparison preview

Do not optimize for a public-facing web launch yet.

The first meaningful milestone is:

- create and edit catalog entities in studio
- attach compatible lenses through adapter chains
- preview at least two kits side by side using real render rules

## Product Priorities

- accuracy over speed
- review-first publishing
- adapters from day one
- multiple systems supported from the start

## Initial Catalog Scope

The initial golden dataset should prove the adapter model with real-world common scenarios.

Locked core systems:

- Leica M mount
- Leica L mount

Third-system direction:

- Nikon Z is currently the recommended third system for the first milestone
- Sony E is a strong follow-up system, but not the best first choice if we optimize for interesting size contrast and easy real-world validation

Why Nikon Z is recommended over Sony E for the initial phase:

- larger size spread across bodies is more visually useful for the comparison product
- the native lens range includes strong physical extremes that stress the renderer well
- direct access to a Nikon Z8 makes validation easier
- we only need one non-Leica interchangeable system at first to prove the adapter and rendering model

Practical interpretation:

- Leica M lenses should be usable natively on M bodies
- Leica M lenses should be attachable to Leica L bodies through adapters
- Leica M lenses should be attachable to Nikon Z bodies through adapters

This gives us immediate pressure on:

- mount modeling
- adapter chains
- multi-system comparisons
- front and top view rendering

## Initial Product Candidates

The current candidate product set is:

Bodies:

- Leica M11-P
- Leica M10
- Leica M EV1
- Leica SL3-S
- Leica SL3
- Panasonic Lumix S1 II
- Nikon Z8
- Nikon Z6 II

Lenses:

- Leica Noctilux-M 35mm f/1.2
- Leica Summilux-M 28mm f/1.4
- Leica APO-Summicron-M 35mm f/2
- Voigtlander Ultron 28mm II
- Leica APO-Summicron-SL 50mm
- Leica 90-280mm
- Sigma 24mm f/1.4 DG Art
- Lumix S 18mm f/1.8
- Nikkor Z 180-600mm
- Nikkor Z 50mm f/1.8
- Nikkor Z 85mm f/1.2

These names should be normalized to official manufacturer naming during seed creation.

## Adapter Modeling

Adapters should not be modeled only as one-off product records.

We need two layers:

1. Theoretical mount conversion geometry
2. Actual adapter products

Theoretical mount conversion geometry should capture:

- source mount
- target mount
- required optical spacing from flange-distance delta
- whether the conversion is mechanically possible
- whether optics are required

Actual adapter products should capture:

- specific manufacturer and model
- actual added length
- weight
- electronics support
- autofocus and aperture behavior
- any physical envelope deviations from the theoretical minimum

Important rule:

- do not assume all adapters with the same mount pair have the same visible size

Many adapters converge around the same required optical spacing, but their external housing, grip clearance, collar shape, electronics, and tripod foot design can differ enough to matter visually.

User-experience rule:

- users should be able to pick a generic adapter choice like `Leica M -> Leica L`
- the system should then resolve that choice to a default real adapter product
- the default can be replaced later by a specific adapter selection when that matters

First-phase adapter policy:

- mechanical adapters only
- no autofocus specialty adapters
- no close-focus specialty adapters
- no optical focal-reducer adapters in the first seed

Initial adapter shortlist:

- Leica M-Adapter L
- Urth Leica M Lens Mount to Nikon Z Camera Mount

Known source-backed adapter facts already identified:

- Leica M-Adapter L is the official Leica M-to-L adapter
- Leica lists the M-Adapter L at approximately `61 x 13.3 mm` and approximately `70 g`
- Urth positions its Leica M to Nikon Z adapter as a manual adapter with infinity focus support

Seeding note:

- use source-backed measurements where available
- if a source does not expose trustworthy physical dimensions, flag the adapter for manual verification before treating it as render-accurate

## Publishing Policy

- all automated facts go to review first
- no auto-publish in the first phase
- official manufacturer facts and official product assets are acceptable starting sources

## Studio Scope

The studio is single-admin for now.

Do not design the first pass around multi-user collaboration complexity.

## Comparison Scope

- start with support for two kits side by side
- keep the system architecture ready for more than two
- support multiple systems from the start

## Dataset Scope

- digital cameras only in the first golden dataset

## View Scope

Priority views for the first implementation phase:

- front
- top

The first internal preview must support:

- body + adapter + lens

Other views are desirable later, but not required to prove the core product loop.

## Units Policy

- store canonical measurements in `mm` and `g`
- support UI display conversion through a metric or imperial toggle

## Image Policy

- official manufacturer assets first
- provenance must be tracked
- all asset qualification and publication remains review-first

Minimum provenance fields to capture from day one:

- source name
- source URL
- fetched timestamp
- product association
- source asset URL
- approval status
- reviewer identity
- notes

## Infrastructure Direction

- simplest managed hosting path
- Supabase for database, storage, auth, and queues
- Vercel for app hosting
- Railway for background workers

The early goal is to reduce operational drag, not to maximize infrastructure control.

## What This Means For Build Order

The implementation order should be:

1. studio app skeleton
2. seed golden dataset
3. compatibility query and adapter-chain tests
4. internal comparison preview
5. review-first ingest pipeline
6. review-first asset qualification and processing

## Still Open

There are no material planning blockers left for the first implementation phase.

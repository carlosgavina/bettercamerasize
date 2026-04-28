# Delivery Roadmap

## Recommendation

Yes, there should be at least two app surfaces.

But I would not build two fully independent products from day one.

Recommended shape:

- `apps/web`: public-facing comparison experience
- `apps/studio`: internal operations and review experience
- worker packages and jobs: background execution for crawl, normalize, segment, and calibrate steps

The public app only becomes valuable once the data and assets are trustworthy. The studio app is how we make them trustworthy.

## What To Build First

My honest recommendation:

Start with the internal studio and a thin render preview, not with the polished public website.

Reason:

- the hardest risks are data quality, compatibility correctness, and image calibration
- the public UX depends on those foundations
- if we build the public site first, we will be demoing empty or unreliable data

But I would not go tooling-only either.

The right first milestone is:

- internal catalog editing
- internal asset review
- minimal visual comparison preview using the same render rules the public app will use

That keeps the tooling grounded in the actual product outcome.

## Delivery Model

Divide the system into narrow pipeline steps with explicit contracts.

Every step should have:

- a clear input contract
- a clear output contract
- quality signals
- a review path for low-confidence cases
- a small end-to-end preview to prove it still serves the product

## Golden Dataset First

Before broad automation, create a hand-reviewed golden dataset.

Recommended first scope:

- 5 brands
- 6 mounts
- 20 camera bodies
- 30 lenses
- 5 to 10 adapters
- 3 views per product for a small subset

This dataset becomes:

- the baseline for tests
- the baseline for UI work
- the benchmark for pipeline accuracy

## Step-by-Step Pipeline

### Step 0: Catalog Foundation

Goal:

- create products, mounts, systems, and compatibility records manually in studio

Input:

- reviewed human-entered catalog data

Output:

- trusted catalog rows in `catalog.*`

Quality gate:

- we can represent a body, a lens, and an adapter chain correctly

How to test:

- seed 10 to 20 known examples
- verify adapter reachability against expected results

### Step 1: Facts Acquisition

Goal:

- fetch product pages, manuals, and source metadata

Input:

- source definitions and crawl targets

Output:

- `ingest.source_records`
- downloaded raw HTML, JSON, or PDFs

Quality gate:

- deterministic fetches with retries and deduplication

How to test:

- snapshot a few known manufacturer pages
- re-run and confirm stable extraction inputs

### Step 2: Facts Extraction

Goal:

- parse specs like dimensions, weight, mount, focal length, aperture, and release status

Input:

- raw source records

Output:

- `ingest.observed_facts`

Quality gate:

- high precision on core fields

How to test:

- fixture-based parser tests
- compare extracted facts against the golden dataset

### Step 3: Facts Reconciliation

Goal:

- merge conflicting observations into publishable catalog edits

Input:

- observed facts from multiple sources

Output:

- proposed catalog changes and review tasks

Quality gate:

- no automatic publish on conflicting core measurements

How to test:

- synthetic conflicts
- audit trail from source fact to final catalog value

### Step 4: Asset Discovery

Goal:

- find candidate product images and associate them with products

Input:

- source pages and galleries

Output:

- candidate asset records linked to products

Quality gate:

- correct product association

How to test:

- sample gallery pages from 3 to 5 brands
- verify product-image pairing accuracy

### Step 5: Asset Qualification

Goal:

- decide whether an image is useful for measurement and which view it represents

Input:

- candidate assets

Output:

- labels like `front`, `rear`, `top`, `left`, `right`, `mount_front`
- flags like `body_only`, `lens_attached`, `perspective_bad`, `cropped`, `usable`

Quality gate:

- reliable view classification and usable/not-usable filtering

How to test:

- labeled review set
- confusion matrix for view labels

Notes:

- use page context first
- use vision models as structured classifiers or QA, not as the only source of truth

### Step 6: Background Removal And Cleanup

Goal:

- isolate the product and create a clean transparent asset

Input:

- qualified candidate assets

Output:

- transparent cutouts
- masks and cleanup diagnostics

Quality gate:

- edges are clean enough for overlay comparison

How to test:

- side-by-side review in studio
- mask quality spot checks

### Step 7: Geometry And Calibration

Goal:

- compute anchors and scale metadata used by the renderer

Input:

- cutout assets plus known physical dimensions

Output:

- `pixels_per_mm`
- baseline anchor
- mount center anchor when visible
- crop and orientation metadata

Quality gate:

- visual comparisons align with known dimensions

How to test:

- overlay two known products and compare measured deltas
- require manual approval for first-pass calibration

### Step 8: Compatibility Materialization

Goal:

- resolve which lenses are reachable from a body with optional adapters

Input:

- body mounts
- lens mounts
- adapter edges

Output:

- queryable compatibility chains and rendered kit specs

Quality gate:

- known chains resolve correctly

How to test:

- database tests for recursive mount traversal
- fixtures for common systems like `L -> M`, `E -> EF`, `Z -> F`

### Step 9: Public Comparison Experience

Goal:

- expose a polished public search and compare UI

Input:

- trusted catalog data
- calibrated assets

Output:

- public comparison product

Quality gate:

- comparisons are fast, trustworthy, and mobile-usable

How to test:

- mobile and desktop exploratory testing
- visual regression tests on known comparisons

## Recommended Build Order

This is the order I would actually implement:

1. Studio app skeleton with auth and catalog CRUD
2. Golden dataset seed and compatibility query tests
3. Internal comparison preview
4. Facts acquisition and extraction pipeline
5. Asset discovery and qualification
6. Background removal and calibration review
7. Public web experience

## Why This Order Works

It avoids two common mistakes:

- building a pretty public shell with weak data underneath
- building an internal data machine with no continuous pressure from the actual comparison experience

The internal comparison preview keeps every pipeline step accountable to the real product.

## Minimal First Milestone

The first milestone I would aim for is not "launch website".

It is:

- create or edit a body, lens, and adapter in studio
- preview a side-by-side comparison internally
- attach a lens via a valid adapter chain
- see correct total dimensions and weight

Once that works, the rest of the roadmap becomes much less speculative.

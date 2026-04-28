# Studio App

This package will host the internal operations interface.

Primary responsibilities:

- manage brands, systems, mounts, bodies, lenses, adapters, and assets
- review crawled facts before publishing them into the catalog
- review image qualification, segmentation, and calibration outputs
- trigger or retry pipeline jobs
- preview the render result before public release

Recommended starting point:

- Next.js app router
- Supabase auth with restricted internal access
- server-side access to catalog and ingest schemas
- tight integration with Storage previews and job status tables

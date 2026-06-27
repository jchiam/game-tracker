## Context

The asset pipeline has two halves that meet at a single convention:

```
BUILD-TIME (write)  →  shared-data-pipeline   →  uploads image bytes to ImageKit
                                                   regenerates src/data/{game}/*.ts
                                                   stores LOCAL /assets/{game}/… paths
                            ┌───── /assets/{game}/{type}/{id}.webp ─────┐
                            │            (the path convention)          │
RUNTIME (read)      →  shared-image-pipeline  →  resolves a stored /assets path
                                                   to an ImageKit CDN URL (with transforms),
                                                   falling back to the local path
```

Grounded in `scripts/update-hsr-data.mjs` (representative; N2E and R1999 follow the same shape)
and `.github/workflows/update-hsr-data.yml`.

## Relation to shared-image-pipeline

This is the central design point of this change.

- **`shared-image-pipeline` is the read path.** At render time `src/lib/imagekit.ts`
  (`getMugshotUrl`, `getRelicIconUrl`, …) maps a stored local `/assets/…` path to an ImageKit URL,
  or returns the local path when ImageKit is not configured. It never writes anything.
- **`shared-data-pipeline` is the write/update path.** The update script uploads the image _bytes_
  to ImageKit at the mirrored location and regenerates the data files. It never resolves URLs at
  render time.
- **They are decoupled by the `/assets/{game}/{type}/{id}.webp` path convention.** The data files
  store the _local_ path, not an ImageKit URL. The write side puts the bytes on ImageKit at the
  location derived from that path; the read side derives the same ImageKit URL from the same path.
  Neither side imports the other; the path string is the entire contract between them.

Consequence captured as a requirement: the update script SHALL store local `/assets/` paths in the
generated data (not CDN URLs), so the read-side resolver stays the single owner of URL shape and
the fallback behaviour. This change references that read behaviour and does not restate it.

## Decisions

### One new capability, bootstrap pattern

Mirrors the other bootstrap changes: describe existing code as `## ADDED Requirements`, validate
`--strict`, archive into `openspec/specs/`. Documentation only.

### Shared, not per-game

`hsr-imagekit-upload` and `n2e-cartridge-catalog` stay as game-specific specs (HSR relic/portrait
upload details; N2E cartridge catalog shape). `shared-data-pipeline` captures only the invariants
common to every game's script and workflow, and cross-references the two game-specific specs as
instances rather than absorbing them.

### ImageKit-optional and idempotent are load-bearing

The script must regenerate data files even with no ImageKit credentials (uploads simply skipped),
and re-running must not re-upload assets already present (with `--reupload-*` as the explicit
override). These are the properties that make the weekly workflow safe to run unattended.

## Risks / Trade-offs

- **AE is not on the pattern.** Documenting the shared contract makes AE's missing
  `update-ae-data.mjs`/workflow visible; closing that is deliberately a separate implementation
  change, not folded into this doc bootstrap.
- **Validator first-line rule.** Each `### Requirement` body opens with SHALL on its first line.

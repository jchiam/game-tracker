## 1. Author capability delta

- [x] 1.1 Write `specs/shared-data-pipeline/spec.md` from `scripts/update-{hsr,n2e,r1999}-data.mjs`
      and `.github/workflows/update-hsr-data.yml` (update-script contract, generated-data
      invariant, local-path seam to `shared-image-pipeline`, weekly auto-PR workflow).

## 2. Validate

- [ ] 2.1 `npx openspec validate bootstrap-shared-data-pipeline --strict` passes.
- [ ] 2.2 Confirm no-overlap: spec references but does not redeclare the runtime URL-resolution
      rules from `shared-image-pipeline`, nor the game-specific details in `hsr-imagekit-upload`
      and `n2e-cartridge-catalog`.
- [ ] 2.3 Confirm `git status` shows only `openspec/` additions — no source/code/test changes.

## 3. Archive

- [ ] 3.1 Archive via the OpenSpec workflow; the new spec syncs into `openspec/specs/`.
- [ ] 3.2 Write a real `## Purpose` (archive seeds a TBD stub) and commit on `main` (not pushed).

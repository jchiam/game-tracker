## 1. Author capability delta

- [x] 1.1 Write `specs/shared-animations/spec.md` from `src/styles/animations.css` (keyframes
      defined once, globally imported/route-independent, referenced by name; cross-reference the
      duration-token rule owned by `shared-design-tokens`).

## 2. Validate

- [ ] 2.1 `npx openspec validate bootstrap-shared-animations --strict` passes.
- [ ] 2.2 Confirm no-overlap: spec references but does not redeclare the `--duration-*` rule from
      `shared-design-tokens`.
- [ ] 2.3 Confirm `git status` shows only `openspec/` additions — no source/code/test changes.

## 3. Archive

- [ ] 3.1 Archive via the OpenSpec workflow; the new spec syncs into `openspec/specs/`.
- [ ] 3.2 Commit on `main` (not pushed).

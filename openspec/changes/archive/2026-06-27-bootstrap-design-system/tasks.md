## 1. Author capability deltas

- [x] 1.1 Write `specs/shared-card-base/spec.md` from `src/styles/card.css` (skeleton, buttons,
      progress-section primitives; cross-reference collapse/controls/badges, do not restate).
- [x] 1.2 Write `specs/shared-design-tokens/spec.md` from `src/styles/design-tokens.json` +
      `tokens.css` (token-first discipline, not value enumeration).
- [x] 1.3 Write `specs/shared-ui-components/spec.md` from the seven shared component files
      (StatChip, ProgressSection, Modal, GameSwitcher, Navbar, ConfirmCheckbox, PreferenceChain).

## 2. Validate

- [ ] 2.1 `npx openspec validate bootstrap-design-system --strict` passes.
- [ ] 2.2 Confirm no-overlap: new specs reference but do not redeclare collapse / controls /
      badges / progress-gradient requirements.
- [ ] 2.3 Confirm `git status` shows only `openspec/` additions — no source/code/test changes.

## 3. Archive

- [ ] 3.1 Archive via the OpenSpec workflow; three new specs sync into `openspec/specs/`.
- [ ] 3.2 Commit on `main` (not pushed).

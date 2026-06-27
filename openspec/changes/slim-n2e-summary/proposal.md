## Why

N2E's collapsed card summary is 400px — 4–5× taller than HSR (100px) and r1999 (80px). It crams four blocks: stat chips, arc+cartridge one-liner, a clickable cartridge slot (an editing affordance), and the full variable-height Target Build display. This violates P2 (bounded single-line gear digest) and P3 (uniform collapsed height within a game). With the height plumbing already fixed by Change C (inline budgets), this is now purely a "what's in the summary" restructuring.

## What Changes

- **Slim the collapsed summary** to two rows: stat chips + a one-line equip digest — matching the r1999/HSR pattern.
  - **Chips row:** `Lv {level}`, `A {n}/6` (awakening), and a conditional `Cart {score}%` chip (gradient-colored, shown only when `hasCartridgePrefs`).
  - **Equip one-liner:** `{Arc name} · {Cartridge name} {rarity} Lv{level}` — read-only, no click affordance.
- **Move the cartridge slot section** (the clickable "equip/edit cartridge" affordance) into the edit body. It opens `CartridgeEditorModal` on click — an editing action that per P1 belongs behind the ✎ toggle.
- **Move the Target Build display** into the edit body as a read-only block below the cartridge slot. Full detail preserved; just relocated from always-visible to expanded-only.
- **Drop `--game-card-summary-max-height` from 400px to ~100px** — the summary is now just chips + one line, same as other games.

## Capabilities

### Modified Capabilities

- `n2e-character-detail`: Add a presentation requirement for the card's collapse composition — what appears in the collapsed summary vs the edit body. Data-field requirements unchanged.
- `shared-card-collapse`: The N2E height budget scenario updates from 400px to ~100px for the summary.

## Impact

- **Modified:** `src/pages/neverness-to-everness/components/CharacterCard.tsx` (restructure summary + edit body), `CharacterCard.css` (remove cartridge-slot-section from summary context if needed), `CharacterCard.test.tsx` (assertions for new layout).
- **No DB, service, hook, or scoring changes.** The cartridge score badge stays in the header overlay; `calculateCartridgeScore` and `getScoreGrade` are untouched.
- **Builds on:** Changes A (gradient), B (canonical classes), C (inline budgets + HSR collapse).
- **Out of scope:** CartridgeEditorModal internals, cartridge scoring logic, N2E data model.

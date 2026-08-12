## 1. GameCardShell slot widening

- [x] 1.1 Widen `summaryLine` prop to `ReactNode | ReactNode[]` in `GameCardShell.tsx`; render arrays as one `.game-card-static-line` div per entry (positional keys), single node unchanged; document the array contract in the prop JSDoc
- [x] 1.2 Add/extend GameCardShell tests: array input renders sibling `.game-card-static-line` divs in order; single-node behaviour unchanged
- [x] 1.3 Update `GameCardShell.stories.tsx` with a multi-line summary variant

## 2. HSR summary split

- [x] 2.1 In HSR `CharacterCard.tsx`, pass `summaryLine` as a two-element array: line 1 = Light Cone readout (icon, name, `Lv`, `S#`, match badge) with `—`/`.no-equip` fallback when no cone; line 2 = relic set digest with `—`/`.no-equip` fallback when no sets; drop the old cone/relic joiner `·`
- [x] 2.2 Update `CharacterCard.test.tsx` summary assertions: two static lines, cone content on the first, relic sets on the second, per-line `—` empty states (including both-empty two-dash case), match badge on line 1

## 3. Verification

- [x] 3.1 Run `npm test`, `npm run lint`, `npm run format:check`; visually confirm no overflow on a long-cone-name + two-set card and uniform collapsed heights across mixed-equipment cards

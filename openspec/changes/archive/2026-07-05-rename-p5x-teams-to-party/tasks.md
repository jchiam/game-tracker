## 1. Source wording

- [x] 1.1 `P5xPage.tsx`: change `secondViewLabel="Teams"` to `"Parties"` and subtitle `"...and build teams."` to `"...and build parties."`
- [x] 1.2 `components/PartiesTab.tsx`: set config nouns `party: 'Party'`, `partiesLower: 'parties'`, `header: 'Your Parties'`
- [x] 1.3 `services/persona-5-phantom-x/partyService.ts`: change `defaultName: 'New Team'` to `'New Party'` and update the "favorited team" comment to "party"
- [x] 1.4 `src/lib/games.ts`: change P5X `description` from `"...and team compositions."` to `"...and party compositions."`
- [x] 1.5 `components/PartiesTab.css`: update the "P5X teams use..." comment to "party"

## 2. Tests

- [x] 2.1 `P5xPage.test.tsx`: update the view-switch test to click/expect `"Parties"` and header `"Your Parties"`; rename local "Team" fixture strings
- [x] 2.2 `components/PartiesTab.test.tsx`: update any team-noun assertions to party
- [x] 2.3 `hooks/persona-5-phantom-x/useParties.test.ts` and `services/persona-5-phantom-x/partyService.test.ts`: rename "Team"/"New Team" fixture strings to party equivalents (assertion-relevant ones only)

## 3. Verify

- [x] 3.1 Grep `[Tt]eam` across the P5X module + P5X `games.ts` entry — confirm no stray "team" wording remains
- [x] 3.2 Run `npm run lint && npm run format:check`
- [x] 3.3 Run `npm test` (P5X page/hook/service suites green)
- [x] 3.4 Run `npx openspec validate --all`

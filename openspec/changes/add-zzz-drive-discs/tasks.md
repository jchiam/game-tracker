# Tasks — Add ZZZ Drive Discs (Phase 2)

## 1. Data pipeline + catalogs

- [x] 1.1 Extend `scripts/update-zzz-data.mjs`: fetch `equipments.json`, map `Suits` (id, locs-resolved name, icon), `ensureAsset` each icon from the Enka UI CDN to ImageKit `zenless_zone_zero/disc-suits/{suitId}.png`, emit generated `src/data/zenless-zone-zero/disc_suits.ts`, add `--reupload-discs` via `parseReuploadFlags(['agents','discs'])`, print per-catalog diffs (HSR multi-catalog shape; agent path untouched)
- [x] 1.2 Run the script; verify ~30 suits emitted, icons uploaded, agents diff empty
- [x] 1.3 Create `src/data/zenless-zone-zero/discs.ts`: `ZzzEquippedDisc` interface, `ZzzDiscSlot` type, `ZZZ_DISC_FIXED_MAINS` (1–3), `ZZZ_DISC_MAIN_STATS` (pools for 4–6), `ZZZ_DISC_SUB_STATS` (10-stat pool) — single source for editor + scorer
- [x] 1.4 Create hand-curated `src/data/zenless-zone-zero/disc_suit_short_names.ts` covering all emitted suits
- [x] 1.5 Add `getZzzDiscSuitIconUrl` (width transform, local-path fallback) to `src/lib/imagekit.ts` + tests

## 2. Types + DB

- [x] 2.1 Extend `ZzzTrackedAgent` in `src/types.ts`: `discs: Record<ZzzDiscSlot, ZzzEquippedDisc | null>`, `buildPreferences` (mainStats 4–6 chains, subStats chain, `discSuit4Id`, `discSuit2Id`, `comments`); keep both out of `ZzzAgentPatch`
- [x] 2.2 Migration `20260817000000_add_zzz_disc_tables.sql`: `zzz_equipped_discs` (slot INT CHECK 1–6, UNIQUE(tracked_agent_id, slot)), `zzz_disc_substats`, `zzz_disc_preferences` (category CHECK slot4_main/slot5_main/slot6_main/sub_stats, operator CHECK), `ALTER TABLE zzz_tracked_agents ADD` `disc_suit_4_id`/`disc_suit_2_id`/`disc_comments`; FK indexes; four-policy RLS per table (child EXISTS, grandchild two-level EXISTS)

## 3. Service + hook

- [x] 3.1 `agentService.ts`: add `extras` seam (nested selectFragment for discs/substats/preferences, `mapRow` pivoting slots + `rowsToChain` per category + parent-column suit picks/comments); extend base `select` with new parent columns
- [x] 3.2 `agentService.ts`: add `upsertDisc` (upsert on `(tracked_agent_id, slot)`, delete+reinsert substats), `deleteDisc`, `saveDiscPreferences` (single `savePreferenceRows` call with parentUpdate)
- [x] 3.3 Service tests: extras mapping, upsert/delete disc, preference save row shapes
- [x] 3.4 `useAgents.ts`: pull `queueAction`/`trackedRef`/`setTrackedEntities`; add `saveDiscData` (`${dbId}-${slot}`), `removeDiscData` (writes `null`, `${dbId}-${slot}-delete`), `saveDiscPreferences` (`${dbId}-discprefs`); `getFilteredRoster` gains `'SCORE'` sort with `scoreFor` param
- [x] 3.5 Hook tests (hoisted-mock pattern): optimistic disc save/remove-to-null, prefs whole-object replace, score sort ordering with `-1` sentinel last

## 4. Scoring

- [x] 4.1 `src/utils/discScoring.ts`: `ZZZ_STAT_SHAPES` vocabulary, `setTerm` with greedy same-suit spill (0.67/0.33), slots map (1–3 fixed 1.0, 4–6 chain rules), `calculateDiscScore = createEquipmentScore(...)`
- [x] 4.2 Scoring tests: `-1` sentinels, perfect score, set-term regimes (distinct suits / same suit 4pc / same suit 6pc spill), fixed-slot 1.0, empty-chain don't-care, chain-set-no-main 0, flat-vs-percent substat match

## 5. UI

- [x] 5.1 `DiscEditorModal.tsx` over `EquipmentEditorShell`: Equip tab (6 slot cards — suit `Select`, main `Select` 4–6 / read-only 1–3, `SubStatList`, `is-gated` gating, main pruned from substats on save, `useScrollAnchor`); Preferences tab (4pc/2pc suit `Select`s, `PreferenceChain` ×3 + subs, `BuildComments`, whole-object updates) + component CSS overrides only
- [x] 5.2 `DiscEditorModal` tests: gating, fixed-main enforcement, prune-on-save, anchor scroll, preference whole-object emit
- [x] 5.3 `AgentCard.tsx`: `ScoreBadge` headerExtra + `temperScore`, suit digest `summaryLine` (short names + counts, em-dash placeholder), edit-body "Drive Discs" `.card-section-group` with `.equip-slot-grid` (icon or fallback glyph, click opens editor at slot), gated Target Build readout (`PreferenceChainReadout` + suit badges + comments)
- [x] 5.4 `AgentCard` tests: badge hidden on `-1`, digest line, slot cell click payload, readout gating
- [x] 5.5 `ZzzPage.tsx`: `editingDisc` state, conditional `DiscEditorModal` mount wired to hook functions, `SCORE` sort mode registered with `useRosterView`, `scoreFor` passed to `getFilteredRoster` + page test updates

## 6. Verify

- [x] 6.1 `npx openspec validate --all`
- [x] 6.2 `npm run lint && npm run format:check && npm test && npm run build`
- [x] 6.3 Storybook check: no new L1–L3 surface expected (all shared primitives reused) — confirm nothing needs a story update

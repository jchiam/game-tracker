## Context

`SegmentedButtons` under `fill="cumulative"` (only consumer: the ZZZ Core Skill row) renders four rung states: attained, added-preview, dropped-preview, empty. As originally specced, the dropped-preview state was deliberately neutral — no gradient hue — on the theory that "the hue is what the click removes". In practice this made the baseline ramp colour vanish during ordinary interaction: hovering the selected rung grayed the entire run, hovering a lower rung grayed the tail, and clicking a rung grayed the run instantly because the pointer was still resting on the now-selected rung, triggering its own deselect preview. The implementation was fixed first; this change updates the specs to match.

## Goals / Non-Goals

**Goals:**

- The investment-gradient hue stays visible on every non-empty rung in every interaction state; hover and selection only layer treatment on top.
- The click's result renders committed immediately — no preview flash on the just-clicked rung.
- The dropped-preview state remains distinguishable from attained and added-preview.

**Non-Goals:**

- No change to selection semantics (`onChange` values, `allowDeselect`, cumulative fill math).
- No change to the added-preview or attained treatments.
- No change to exact-fill (`fill="exact"`) rows or any non-cumulative `SegmentedButtons` host.

## Decisions

- **Drop rungs take the attained inline hue, not a preview-strength one.** `getProgressStyle` (full strength) rather than `getPreviewStyle`: the rungs _are_ currently attained; the preview only threatens them. The visual ranking then falls out of one axis per state: attained = full hue + glow; added = preview-strength hue + dashed; dropped = full hue dimmed + dashed.
- **The drop treatment is structural, owned by CSS.** `.rung-drop` declares only `border-style: dashed; opacity: 0.55` — no background/border-color/color overrides. The component keeps supplying the hue inline for every non-empty rung, so CSS never needs to know the ramp. Alternative considered: a desaturating `filter` — rejected as heavier and less token-friendly than opacity.
- **Click clears both hover and focus preview indices.** `mouseenter` will not re-fire while the pointer stays inside the button, so the committed state holds until the pointer genuinely leaves and re-enters — which is exactly when a fresh preview is meaningful. Focus is cleared too because a mouse click focuses the button; keyboard users re-trigger the preview by moving focus away and back.

## Risks / Trade-offs

- [Dashed border now appears in both added and dropped previews] → The two remain distinguishable by hue strength and opacity: added is preview-alpha hue at full opacity, dropped is full hue at 0.55 opacity. Storybook `Cumulative` story documents the states side by side.
- [`opacity: 0.55` is a literal, not a token] → The token mandate covers colour/spacing/radius/shadow/transition/duration/z-index; opacity literals are the existing convention in `controls.css` (0.4–0.9 in neighbouring rules).
- [After a deselect click the row shows the resting empty state while the pointer still hovers the rung] → Accepted: it shows the true result of the click; the next pointer movement restores preview behaviour.

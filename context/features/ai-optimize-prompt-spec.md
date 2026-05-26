# AI Optimize Prompt

## Overview

Add AI-powered prompt refinement for `prompt` items in the item drawer using OpenAI `gpt-5-nano`. Mirrors the existing **Explain Code** affordance on snippets/commands (button in the editor header, Pro-gated, Responses API, manual JSON parse), but lives on the `MarkdownEditor` and modifies the item's `content` field instead of producing an ephemeral explanation. Pro-only feature.

## Requirements

- Create an `optimizePrompt` server action with auth, real `getUserIsPro` DB read, Zod validation, per-user rate limiting, 2000-char input truncation.
- Use the OpenAI Responses API (`text.format: json_object`, literal "json" in `input` — gpt-5-nano gotcha), parse tolerantly for `{"prompt": "..."}` or a bare string, return `{ success, prompt } | { success, error }`.
- Add an "Optimize" button (Sparkles icon, blue `AI_ACCENT_COLOR` tint) to the `MarkdownEditor` header on `prompt` items only — visually paired with the `Copy` button, slot mirrors `CodeEditor`'s Explain button.
- Pro gating in UI: free users see a disabled `Crown` icon button with `title="AI features require Pro subscription"`, matching the `CodeEditor` pattern.
- When optimization succeeds, swap the editor body into a **Refined** preview pane (read-only markdown of the new prompt) and replace the header tabs with **Use this prompt** (primary) + **Discard** controls.
- **Use this prompt** calls the existing `updateItemAction` with the same payload but `content` swapped to the refined value, then refreshes the drawer + router. Do NOT add a second server action just for prompt content swap.
- **Discard** returns to the original prompt view, no DB write.
- Loading state: `LoaderCircle` spinner inside the button while generating, optional disabled state on Apply while the parent save is in flight.
- Error handling via toast with the standard Upgrade CTA pattern when the error string contains `"Pro"` (route to `/upgrade`).
- Unit tests for the server action (mirror `ai-explain.test.ts` shape).

## Notes

- Surface lives on the **read** view of an item drawer only — not in create/edit forms (matches Explain).
- `MarkdownEditor` gains an `optimizeContext?: { typeName: "prompt"; title?: string | null }` prop (mirrors `CodeEditor`'s `explainContext`) + an `onApplyOptimized?: (newContent: string) => void` callback + an `applyingOptimized?: boolean` flag so the parent owns the actual `updateItemAction` call.
- `ItemDrawer` owns a `handleApplyOptimized(newContent)` + `applyingOptimized` `useTransition` slice, threads them through `ItemDrawerBody` → `MarkdownEditor`.
- `ItemDrawerBody` only enables the optimize button for `typeName === "prompt"` — `note` (the other markdown type) is deliberately excluded, matching the spec's "prompt item types" scope.
- New `AI_OPTIMIZE_PROMPT_PER_HOUR = 20` constant in `src/lib/constants.ts` (per the centralization rule) + new `aiOptimizePrompt` entry in `src/lib/rate-limit.ts` `LimiterName` union + `LIMITS` table (`tokens: AI_OPTIMIZE_PROMPT_PER_HOUR`, `window: "1 h"`).
- Optimization is ephemeral until the user clicks **Use this prompt** — the refined text lives in local component state, not the DB, until they accept it.
- Toast on successful apply: "Prompt updated".
- No DB schema changes (action writes through the existing `Item.content` field).
- Components stay out of Vitest scope per `coding-standards.md` Testing section; the new server action gets full mirror coverage of the `ai-explain.test.ts` matrix.

## Testing

- Action tests in `src/actions/__tests__/ai-optimize-prompt.test.ts` covering: no session, free-user gate, JWT staleness check, rate-limit fail, empty-content Zod fail, parse `{"prompt": "..."}`, parse bare string, long-content truncation marker + `json` literal in input + model + format, empty `output_text` failure, malformed JSON failure, OpenAI throw with `console.error` spied.

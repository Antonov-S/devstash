# Dashboard UI Typography & Spacing Refresh

## Overview

Refine the dashboard UI typography, spacing, and visual hierarchy for better readability on large monitors. The goal is to improve consistency across dashboard components (cards, drawers, dialogs, forms, and search inputs) while preserving all existing functionality and interactions.

Changes should focus only on UI/UX polish — no business logic, state handling, or data flow should be modified.

Use the existing sidebar typography and spacing as the visual baseline/reference for consistency across the application.

Requirements
General Goals
Improve readability on large displays
Increase consistency between dashboard components
Normalize typography scale and spacing system
Preserve existing layouts and functionality
Keep current visual style and component architecture
Use existing Tailwind utility conventions already present in the project
Reuse existing typography tokens/classes where possible
Typography Adjustments
Dashboard Header
Status Bar (top centered dashboard status)

Current:

Uses text-sm
Current line-height feels correct

Requirements:

Keep current font size and line-height
Use as baseline reference for readable body text sizing
Dashboard Title (h1)

Current:

Uses text-2xl

Requirements:

Keep current sizing
Preserve current spacing and visual hierarchy
Section Titles (h2)

Current:

Uses text-base
Appears too small compared to surrounding UI

Requirements:

Increase hierarchy and readability
Recommended:
text-lg
font-semibold
Slightly improved vertical spacing

Audit all dashboard section headings for consistency.

Item Cards

Current:

Primary card text uses text-xs
Difficult to read on larger monitors

Requirements:

Increase typography size for:
titles
metadata
descriptions
tags where applicable
Recommended baseline:
body text → text-sm
secondary metadata → text-xs or text-sm
Improve line-height for multi-line content
Slightly increase internal card padding if necessary to support larger typography

Do not:

Change card behavior
Modify interactions
Alter card density drastically
Item Detail Drawer

Current:

Typography appears too compact on large screens

Requirements:

Increase readability of:
titles
labels
content text
metadata
tabs/sections if present
Improve spacing between content blocks
Ensure comfortable reading width and line-height
Match typography rhythm used in sidebar/navigation components

Drawer should feel less dense while preserving information hierarchy.

New Item Dialog

Current:

Form text and labels appear too small

Requirements:

Increase readability for:
labels
inputs
placeholders
helper text
select/dropdown content
Improve vertical spacing between form groups
Ensure dialog feels visually balanced on desktop screens
Match sidebar typography system where applicable

Recommended:

labels → text-sm font-medium
inputs → text-sm
group spacing → space-y-4 or equivalent
Search Bar

Current:

Search input typography appears too small relative to surrounding UI

Requirements:

Increase input text size
Improve padding and input height if needed
Ensure placeholder text remains readable
Align visually with sidebar input styling patterns

Recommended:

text-sm or text-base
Slightly larger horizontal padding
Spacing & Layout Consistency
Global Dashboard Audit

Perform a consistency audit between:

Sidebar typography
Dashboard typography
Drawer typography
Dialog typography
Form controls
Cards

Goals:

Consistent line-height usage
Consistent font-weight hierarchy
Consistent spacing rhythm
Consistent input sizing
Consistent label styling

Use the sidebar as the primary design reference because its typography and spacing currently feel balanced and readable.

Design Constraints
Functional Constraints
No functionality changes
No state management changes
No API or server action modifications
No component behavior changes
No routing changes
Styling Constraints
Prefer Tailwind utility updates over structural rewrites
Reuse existing design tokens/styles when available
Avoid introducing a completely new design language
Preserve current dark/light theme compatibility
Preserve responsive behavior
Suggested Areas To Review
Dashboard top bar
Search/filter toolbar
Item cards
Empty states
Drawer headers/content
Dialog forms
Labels and helper text
Tabs and section headers
Sidebar typography tokens/classes
Shared UI components used across dashboard screens
Implementation Notes
Compare typography scale usage across components and normalize inconsistencies
Use existing screenshots from the project context as visual reference for the intended direction
Prioritize readability and spacing polish over visual redesign
Ensure improvements are noticeable on large monitors/desktops
Avoid overly large typography that increases visual noise
Acceptance Criteria
Dashboard typography feels visually consistent
Small unreadable text sizes are eliminated
Cards, drawers, dialogs, and forms are easier to scan
Sidebar and dashboard typography feel unified
UI feels more polished on large displays
No functionality regressions
No layout breaking changes
All changes remain purely visual/UI-focused

Checkout Success Page Update
Overview

Update the /checkout/success page to better reflect actual Pro-only functionality and remove misleading/non-Pro onboarding actions.

Requirements
Remove non-Pro actions

Remove the following cards/actions entirely from the success screen:

“Create your first Snippet”
“Add a prompt”

Reason:
These are core features available to all users and should not appear as Pro upgrade benefits.

Update collections upgrade messaging

Replace:

“Organize items into collections”

With improved Pro-specific wording such as:

“Create more collections”

or similar wording that clearly communicates:

Free users are limited to 3 collections
Pro users can create additional/unlimited collections

The messaging should emphasize expanded limits rather than basic collection functionality.

Communicate expanded item limits

Add a simple message that informs the user Pro also expands the item limit (Free is capped at 50 items; Pro is unlimited). Keep it short — a checklist item, a one-line note near the collections messaging, or similar — no new sections or layout changes.

Increase a confety effect a bit.

Enable AI auto-tagging action

Currently:

“Try AI auto-tagging on an item” appears disabled/inactive

Change it so that:

The card/action is visually active
The CTA button is clickable/enabled
Hover/cursor states should behave like a normal active action
Temporary placeholder behavior for AI auto-tagging

The AI auto-tagging feature is not implemented yet.

For now:

The CTA/button should navigate to a non-existing route/page
Returning a 404 is expected and intentional
Do NOT implement backend logic or placeholder functionality yet

This is only to make the feature appear unlocked and upcoming for Pro users.

Notes
Keep the existing visual style/layout intact
Only update content and interaction behavior described above
Avoid adding new UI sections or changing spacing unnecessarily

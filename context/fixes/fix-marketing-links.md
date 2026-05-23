Fix Marketing Nav Anchor Links on Auth Pages
Issue

During the implementation of Marketing nav on auth pages + dashboard logo in sidebar header, a navigation bug was introduced in the marketing navbar rendered above all auth pages.

Currently, the navbar buttons:

Features
AI
Pricing

incorrectly resolve relative to the current auth route.

Examples:

/sign-in#features
/sign-in#ai
/sign-in#pricing

instead of navigating users back to the corresponding anchored section on the homepage.

The issue persists across all auth pages, not only /sign-in.

Transform the current login/signin page into the exact visual structure and UX style of the reference design @context/screenshots/logIn-screen-dev-stash.jpg

GOAL:
Create a polished centered auth card layout with compact spacing, strong visual hierarchy, and modern dark SaaS aesthetics.

REQUIRED CHANGES:

1. Layout

- Replace the floating form layout with a centered auth card container
- Add:
  - rounded-xl or rounded-2xl card
  - subtle border
  - dark elevated background
  - soft shadow
- Constrain width to approximately max-w-md
- Center everything vertically and horizontally

2. Spacing & Structure
   Reorganize the content order to:

- Title
- Subtitle
- Email input
- Password input
- Primary Sign In button
- Divider with horizontal lines and centered text
- GitHub OAuth button
- Register link

Use a consistent 8pt spacing system:

- gap-2
- gap-4
- gap-6
- gap-8

Reduce excessive whitespace.

3. Typography

- Use sans-serif typography
- Heading:
  - bold
  - compact
  - visually dominant
- Subtitle:
  - muted foreground color
  - smaller size
- Improve label readability and spacing

4. Inputs
   Style inputs with:

- dark background
- subtle border
- smooth radius
- proper focus ring
- consistent height

Place “Forgot password?” aligned right inside the password row.

5. Buttons
   Primary button:

- full width
- high contrast light button
- dark text
- medium-large height
- hover transition

GitHub button:

- secondary variant
- bordered dark button
- include GitHub icon
- visually less dominant than primary CTA

6. Divider
   Create a proper auth divider:

- horizontal line left
- centered “OR CONTINUE WITH”
- horizontal line right

7. Visual Refinement
   Apply:

- better content grouping
- improved contrast hierarchy
- subtle shadows
- polished dark theme aesthetics
- tighter alignment
- improved visual balance

8. Responsive Behavior
   Ensure:

- mobile-first responsiveness
- centered card on all breakpoints
- no oversized form width

9. Maintain Existing Functionality
   DO NOT break:

- form validation
- auth logic
- GitHub OAuth
- navigation links
- accessibility

The current technical steps are indicative, you can make your own suggestions.

IMPORTANT: Only refactor UI/UX and layout styling, do not tuch any functionality.

// Shared shell className for the small icon buttons overlaid on item cards
// (QuickCopyButton, QuickFavoriteButton). Keeps the size/border/backdrop/focus
// treatment identical across both so the card affordances read as one set.
export const quickActionButtonClass =
  "inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

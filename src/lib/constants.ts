import type { SystemTypeName } from "@/lib/system-types";

export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;
export const FAVORITES_ITEMS_LIMIT = 200;
export const FAVORITES_COLLECTIONS_LIMIT = 200;

export const FREE_TIER_LIMITS = {
  items: 50,
  collections: 3
} as const;

export const PRO_ONLY_ITEM_TYPES = new Set<string>(["file", "image"]);

// Item-type membership sets that decide which fields / editors an item type
// renders. Keyed by the lowercased system type name. Single source of truth for
// the new-item dialog, the item drawer, and the item card copy affordance.
export const ITEM_TYPES_WITH_CONTENT = new Set<string>([
  "snippet",
  "prompt",
  "command",
  "note"
]);
export const ITEM_TYPES_WITH_LANGUAGE = new Set<string>(["snippet", "command"]);
export const ITEM_TYPES_WITH_MARKDOWN = new Set<string>(["note", "prompt"]);
export const ITEM_TYPES_WITH_UPLOAD = new Set<string>(["file", "image"]);

export type PricingPeriod = "monthly" | "yearly";

// Pro plan pricing copy. Single source of truth for the marketing pricing
// section and the upgrade page pricing card.
export const PRO_PRICE: Record<
  PricingPeriod,
  { amount: string; period: string; note: string }
> = {
  monthly: { amount: "$8", period: "/ month", note: "Billed monthly" },
  yearly: {
    amount: "$6",
    period: "/ month, billed yearly",
    note: "$72 billed yearly"
  }
};

// Canonical Pro feature list. Single source of truth for the marketing pricing
// section, the upgrade page pricing card, and the upgrade-prompt dialog.
export const PRO_FEATURES = [
  "Unlimited items & collections",
  "File & image uploads",
  "AI auto-tagging & summaries",
  "Explain code & prompt optimizer",
  "Export as JSON or ZIP",
  "Priority support"
] as const;

export const ONBOARDING_STORAGE_KEY = "devstash:welcome-to-pro:checklist:v1";

export type OnboardingChecklistItemId = "upload" | "collection" | "ai";

export type OnboardingChecklistItem = {
  id: OnboardingChecklistItemId;
  label: string;
  comingSoon?: boolean;
};

export const ONBOARDING_CHECKLIST_ITEMS: readonly OnboardingChecklistItem[] = [
  { id: "upload", label: "Upload a File or Image" },
  { id: "collection", label: "Create more than 3 collections" },
  { id: "ai", label: "Try AI auto-tagging on an item" }
];

export const PRO_TIPS = [
  "Use Ctrl+K (or ⌘K) to search across all your items instantly.",
  "Drag a file straight onto the New File dialog to upload it.",
  "Pin items to the top of every list so they're one glance away.",
  "Add an item to multiple collections — no copies needed.",
  "Favorite collections show up first in the sidebar.",
  "Markdown works in notes and prompts — try a checklist or table."
] as const;

export const SYSTEM_TYPE_COLORS: Record<SystemTypeName, string> = {
  snippet: "#3b82f6",
  prompt: "#8b5cf6",
  command: "#f97316",
  note: "#fde047",
  file: "#6b7280",
  image: "#ec4899",
  link: "#10b981"
};

export type CodeLanguageOption = { value: string; label: string };

export const DEFAULT_CODE_LANGUAGE = "plaintext";

export const CODE_LANGUAGES: readonly CodeLanguageOption[] = [
  { value: "plaintext", label: "Plain Text" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "go", label: "Go" },
  { value: "graphql", label: "GraphQL" },
  { value: "html", label: "HTML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "kotlin", label: "Kotlin" },
  { value: "lua", label: "Lua" },
  { value: "markdown", label: "Markdown" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "scss", label: "SCSS" },
  { value: "shell", label: "Shell / Bash" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" }
];

// AI
//
// gpt-5-nano is the cheapest current OpenAI model with the inputs we need.
// IMPORTANT: this model only works with the Responses API — chat.completions
// returns empty content. See src/lib/openai.ts.
export const AI_MODEL = "gpt-5-nano" as const;

// Hard cap on user-supplied content sent to the model. Items truncate at this
// length before the call so a 50K-line snippet can't generate a $5 request.
export const AI_MAX_INPUT_CHARS = 2000;

// Per-user, per-hour cap on the Suggest Tags action.
export const AI_SUGGEST_TAGS_PER_HOUR = 40;

// Per-user, per-hour cap on the Generate Description action.
export const AI_GENERATE_DESCRIPTION_PER_HOUR = 40;

// Per-user, per-hour cap on the Explain Code action.
export const AI_EXPLAIN_CODE_PER_HOUR = 40;

// Per-user, per-hour cap on the Optimize Prompt action.
export const AI_OPTIMIZE_PROMPT_PER_HOUR = 40;

// Shared blue accent for AI affordances (matches SYSTEM_TYPE_COLORS.snippet
// and the homepage hero gradient). Keep the two AI buttons (Suggest tags,
// Generate description) visually unified by referencing this single value.
export const AI_ACCENT_COLOR = "#3b82f6";

export const CODE_LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  golang: "go",
  rs: "rust"
};

export const SYSTEM_TYPE_NAMES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link"
] as const;

export type SystemTypeName = (typeof SYSTEM_TYPE_NAMES)[number];

const slugByName: Record<SystemTypeName, string> = {
  snippet: "snippets",
  prompt: "prompts",
  command: "commands",
  note: "notes",
  file: "files",
  image: "images",
  link: "links"
};

const nameBySlug: Record<string, SystemTypeName> = Object.fromEntries(
  (Object.entries(slugByName) as [SystemTypeName, string][]).map(
    ([name, slug]) => [slug, name]
  )
);

export function systemTypeNameFromSlug(slug: string): SystemTypeName | null {
  return nameBySlug[slug] ?? null;
}

export function slugFromSystemTypeName(name: SystemTypeName): string {
  return slugByName[name];
}

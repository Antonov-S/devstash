"use client";

import { useEditorPreferences } from "@/components/editor/editor-preferences-context";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  EDITOR_THEMES,
  FONT_SIZES,
  TAB_SIZES,
  type EditorPreferences
} from "@/lib/editor-preferences";
import { cn } from "@/lib/utils";

const THEME_LABELS: Record<EditorPreferences["theme"], string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark"
};

export function EditorPreferencesForm() {
  const { prefs, setPref, isSaving } = useEditorPreferences();

  return (
    <div
      className="flex flex-col gap-4"
      aria-busy={isSaving}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          id="editor-font-size"
          label="Font size"
          value={String(prefs.fontSize)}
          onChange={(v) => setPref("fontSize", Number(v) as EditorPreferences["fontSize"])}
          options={FONT_SIZES.map((size) => ({
            value: String(size),
            label: `${size}px`
          }))}
        />
        <SelectField
          id="editor-tab-size"
          label="Tab size"
          value={String(prefs.tabSize)}
          onChange={(v) => setPref("tabSize", Number(v) as EditorPreferences["tabSize"])}
          options={TAB_SIZES.map((size) => ({
            value: String(size),
            label: `${size} spaces`
          }))}
        />
        <SelectField
          id="editor-theme"
          label="Theme"
          value={prefs.theme}
          onChange={(v) => setPref("theme", v as EditorPreferences["theme"])}
          options={EDITOR_THEMES.map((theme) => ({
            value: theme,
            label: THEME_LABELS[theme]
          }))}
          className="sm:col-span-2"
        />
      </div>

      <div className="flex flex-col gap-3">
        <ToggleRow
          id="editor-word-wrap"
          label="Word wrap"
          description="Wrap long lines in the editor"
          checked={prefs.wordWrap}
          onChange={(v) => setPref("wordWrap", v)}
        />
        <ToggleRow
          id="editor-minimap"
          label="Minimap"
          description="Show a code outline on the right of the editor"
          checked={prefs.minimap}
          onChange={(v) => setPref("minimap", v)}
        />
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  className
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  const labelByValue = Object.fromEntries(
    options.map((o) => [o.value, o.label])
  );
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next != null) onChange(next);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue>{(v) => labelByValue[v as string] ?? ""}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="flex flex-col">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          checked ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-background shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
          aria-hidden
        />
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}

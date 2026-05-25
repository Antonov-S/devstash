"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  CODE_LANGUAGES,
  CODE_LANGUAGE_ALIASES,
  DEFAULT_CODE_LANGUAGE,
  type CodeLanguageOption
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function LanguageSelect({
  value,
  onChange,
  disabled,
  id,
  className
}: Props) {
  const resolved = resolveLanguageValue(value);
  const inList = CODE_LANGUAGES.some((option) => option.value === resolved);
  const options: readonly CodeLanguageOption[] = inList
    ? CODE_LANGUAGES
    : [{ value: resolved, label: resolved }, ...CODE_LANGUAGES];
  const labelByValue = Object.fromEntries(
    options.map((option) => [option.value, option.label])
  );

  return (
    <Select
      value={resolved}
      onValueChange={(next) => {
        if (typeof next === "string" && next !== resolved) onChange(next);
      }}
    >
      <SelectTrigger
        id={id}
        disabled={disabled}
        className={cn("w-full", className)}
      >
        <SelectValue>
          {(v) => labelByValue[v as string] ?? "Plain Text"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function resolveLanguageValue(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return DEFAULT_CODE_LANGUAGE;
  return CODE_LANGUAGE_ALIASES[trimmed] ?? trimmed;
}

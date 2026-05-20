"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition
} from "react";
import { toast } from "sonner";

import { updateEditorPreferencesAction } from "@/actions/editor-preferences";
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences
} from "@/lib/editor-preferences";

type EditorPreferencesContextValue = {
  prefs: EditorPreferences;
  setPref: <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K]
  ) => void;
  isSaving: boolean;
};

const EditorPreferencesContext = createContext<EditorPreferencesContextValue>({
  prefs: DEFAULT_EDITOR_PREFERENCES,
  setPref: () => {},
  isSaving: false
});

export function EditorPreferencesProvider({
  initial,
  children
}: {
  initial: EditorPreferences;
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<EditorPreferences>(initial);
  const [isSaving, startTransition] = useTransition();

  const setPref = useCallback(
    <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
      // Optimistic update — the server is the source of truth, but the UI must
      // not block on a network round-trip.
      const next: EditorPreferences = { ...prefs, [key]: value };
      const previous = prefs;
      setPrefs(next);

      startTransition(async () => {
        const result = await updateEditorPreferencesAction(next);
        if (result.success) {
          setPrefs(result.data);
          toast.success("Preferences saved");
        } else {
          setPrefs(previous);
          toast.error(result.error);
        }
      });
    },
    [prefs]
  );

  return (
    <EditorPreferencesContext.Provider value={{ prefs, setPref, isSaving }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences(): EditorPreferencesContextValue {
  return useContext(EditorPreferencesContext);
}

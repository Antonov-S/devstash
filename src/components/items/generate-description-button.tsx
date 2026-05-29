"use client";

import { toast } from "sonner";

import {
  generateDescription,
  type GenerateDescriptionPayload
} from "@/actions/ai-description";
import {
  AiActionButton,
  useAiAction
} from "@/components/items/ai-action-button";

type Props = {
  getPayload: () => GenerateDescriptionPayload;
  onResult: (description: string) => void;
  disabled?: boolean;
};

export function GenerateDescriptionButton({
  getPayload,
  onResult,
  disabled
}: Props) {
  const { isPro, pending, run } = useAiAction();

  if (!isPro) return null;

  function handleClick() {
    const payload = getPayload();
    run(
      () => generateDescription(payload),
      (result) => {
        onResult(result.description);
        toast.success("Description generated");
      }
    );
  }

  return (
    <AiActionButton
      onClick={handleClick}
      pending={pending}
      idleLabel="Generate"
      pendingLabel="Generating…"
      ariaLabel="Generate description with AI"
      disabled={disabled}
    />
  );
}

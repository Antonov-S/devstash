import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";

export function getInitials(name: string | null | undefined, email?: string | null) {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  return (
    source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function UserAvatar({
  name,
  email,
  image,
  size = "default",
  className
}: UserAvatarProps) {
  const initials = getInitials(name, email);
  const altName = name ?? email ?? "User";

  return (
    <Avatar size={size} className={cn(className)}>
      {image ? <AvatarImage src={image} alt={altName} /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

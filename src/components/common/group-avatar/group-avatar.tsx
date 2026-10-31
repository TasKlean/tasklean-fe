/**
 * A group's picture, falling back to the first letter of its name. Square
 * rather than round, which is what keeps it from reading as a person.
 *
 * It renders `unoptimized`, so the optimizer's host allowlist is never
 * consulted: a group photo is a URL somebody pasted, and `next/image` throws on
 * a host it was not configured with, which would take the page with it.
 * Widening the allowlist instead would make the optimizer an open image proxy.
 */

import Image from "next/image";
import { isGroupPhotoUrl } from "@/lib/groups/photo/photo";

type GroupAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "lg";
};

const PIXELS = { sm: 36, lg: 80 } as const;
const BOX = { sm: "size-9 rounded-lg", lg: "size-20 rounded-xl" } as const;
const TEXT = { sm: "text-label-lg", lg: "text-headline-md" } as const;

/** Renders a group's photo, or the letter standing in for it. */
export function GroupAvatar({ name, photoUrl, size = "sm" }: Readonly<GroupAvatarProps>) {
  const shell = `bg-muted text-foreground ring-border/60 grid shrink-0 place-items-center overflow-hidden ring-1 ${BOX[size]}`;

  if (isGroupPhotoUrl(photoUrl)) {
    return (
      <span className={shell}>
        <Image
          src={photoUrl}
          alt=""
          width={PIXELS[size]}
          height={PIXELS[size]}
          unoptimized
          className="size-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className={shell}>
      <span className={`${TEXT[size]} font-semibold`}>{name.trim().charAt(0).toUpperCase()}</span>
    </span>
  );
}

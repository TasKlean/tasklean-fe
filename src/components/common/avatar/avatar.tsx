/**
 * The round profile picture, falling back to initials. A photo is only drawn
 * when its host is one `next.config.ts` allows, since the optimizer throws on
 * any other and would take the page down with it.
 */

import Image from "next/image";
import { User } from "lucide-react";
import { isRenderable } from "@/components/common/avatar/is-renderable";
import { initials } from "@/lib/users/name/name";

type AvatarProps = {
  photoUrl?: string | null;
  name?: string | null;
  lastName?: string | null;
  size?: "sm" | "lg";
};

const PIXELS = { sm: 40, lg: 96 } as const;
const BOX = { sm: "size-10", lg: "size-24" } as const;
const TEXT = { sm: "text-label-lg", lg: "text-headline-md" } as const;
const ICON = { sm: "size-5", lg: "size-10" } as const;

/** Renders a profile photo, the wearer's initials, or a neutral placeholder. */
export function Avatar({ photoUrl, name, lastName, size = "sm" }: Readonly<AvatarProps>) {
  const letters = initials(name, lastName);
  const shell = `bg-muted text-muted-foreground ring-border/60 grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ${BOX[size]}`;

  if (photoUrl && isRenderable(photoUrl)) {
    return (
      <span className={shell}>
        <Image
          src={photoUrl}
          alt=""
          width={PIXELS[size]}
          height={PIXELS[size]}
          className="size-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className={shell}>
      {letters ? (
        <span className={`${TEXT[size]} text-foreground font-semibold`}>{letters}</span>
      ) : (
        <User className={ICON[size]} aria-hidden />
      )}
    </span>
  );
}

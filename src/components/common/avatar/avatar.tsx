/**
 * The round profile picture, falling back to initials. An account carries one
 * picture or the other, never both, so ours wins and Google's is the fallback:
 * reading only the URL would draw nothing for anybody who uploaded.
 *
 * The two are drawn differently on purpose. Ours is a background over the
 * initials, which is what makes a dead or refused upload cost nothing, since a
 * background that 404s paints nothing where an `<img>` draws the browser's own
 * broken glyph. Google's is `next/image`, whose host the optimizer allows and
 * which it is therefore worth optimizing.
 */

import Image from "next/image";
import { User } from "lucide-react";
import { isRenderable } from "@/components/common/avatar/is-renderable";
import { uploadedImageSrc } from "@/lib/uploads/image-src/image-src";
import { initials } from "@/lib/users/name/name";

type AvatarProps = {
  // An upload's uid, read through our own route: the bucket is private.
  photoUid?: string | null;
  // Only ever what Google provisioned the account with.
  photoUrl?: string | null;
  name?: string | null;
  lastName?: string | null;
  size?: "xs" | "sm" | "lg";
};

const PIXELS = { xs: 32, sm: 40, lg: 96 } as const;
const BOX = { xs: "size-8", sm: "size-10", lg: "size-24" } as const;
const TEXT = { xs: "text-label-sm", sm: "text-label-lg", lg: "text-headline-md" } as const;
const ICON = { xs: "size-4", sm: "size-5", lg: "size-10" } as const;

/** Renders a profile photo, the wearer's initials, or a neutral placeholder. */
export function Avatar({ photoUid, photoUrl, name, lastName, size = "sm" }: Readonly<AvatarProps>) {
  const letters = initials(name, lastName);
  const uploaded = uploadedImageSrc(photoUid);
  // `relative` is what our own picture's layer is positioned against.
  const shell = `bg-muted text-muted-foreground ring-border/60 relative grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ${BOX[size]}`;

  if (!uploaded && photoUrl && isRenderable(photoUrl)) {
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
      {/* A grid of its own: as a grid item this span is blockified and its
          line box takes the inherited line height, which left small initials
          and the placeholder sitting below the circle's centre. */}
      <span aria-hidden={uploaded ? true : undefined} className="grid size-full place-items-center">
        {letters ? (
          <span className={`${TEXT[size]} text-foreground font-semibold`}>{letters}</span>
        ) : (
          <User className={ICON[size]} aria-hidden />
        )}
      </span>

      {/* Over the initials, which are what shows through when the bytes never
          arrive. The URL is the dynamic value an inline style is allowed. */}
      {uploaded ? (
        <span
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${uploaded}")` }}
        />
      ) : null}
    </span>
  );
}

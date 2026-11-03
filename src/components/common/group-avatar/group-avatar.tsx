/**
 * A group's picture, falling back to the first letter of its name. Square
 * rather than round, which is what keeps it from reading as a person.
 *
 * It renders `unoptimized`, and has to: the picture is read through
 * `/api/image/[uid]`, which is guarded by the session, and Next's optimizer
 * deliberately drops cookies from its own fetch, so an optimized src would be
 * refused and draw nothing.
 */

import Image from "next/image";
import { groupPhotoSrc } from "@/lib/groups/photo/photo";

type GroupAvatarProps = {
  name: string;
  // An upload's uid, not a URL: the bucket is private.
  photoUid?: string | null;
  size?: "sm" | "lg";
};

const BOX = { sm: "size-9 rounded-lg", lg: "size-20 rounded-xl" } as const;
const TEXT = { sm: "text-label-lg", lg: "text-headline-md" } as const;

/** Renders a group's photo, or the letter standing in for it. */
export function GroupAvatar({ name, photoUid, size = "sm" }: Readonly<GroupAvatarProps>) {
  // `relative` is what `fill` needs, and `fill` is what makes the picture
  // actually fill the box: the shell is a grid whose row is content sized, so a
  // height of 100% there is indefinite and a tall photo was drawn at its own
  // height and clipped from the top rather than cropped to the middle.
  const shell = `bg-muted text-foreground ring-border/60 relative grid shrink-0 place-items-center overflow-hidden ring-1 ${BOX[size]}`;
  const src = groupPhotoSrc(photoUid);

  if (src) {
    return (
      <span className={shell}>
        <Image src={src} alt="" fill unoptimized className="object-cover" />
      </span>
    );
  }

  return (
    <span className={shell}>
      <span className={`${TEXT[size]} font-semibold`}>{name.trim().charAt(0).toUpperCase()}</span>
    </span>
  );
}

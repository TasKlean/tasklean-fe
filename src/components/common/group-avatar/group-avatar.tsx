/**
 * A group's picture, falling back to the first letter of its name. Square
 * rather than round, which is what keeps it from reading as a person.
 *
 * The picture is a background over the letter rather than an `<img>`, which is
 * what makes a dead upload cost nothing: a background that 404s paints nothing,
 * where a broken `<img>` draws the browser's own glyph whatever its `alt` says.
 */

import { groupPhotoSrc } from "@/lib/groups/photo/photo";

type GroupAvatarProps = {
  name: string;
  // An upload's uid, not a URL: the bucket is private.
  photoUid?: string | null;
  // Named for the screen it is on, not for a scale: each of the three has one
  // caller, and two of them are the same size once the viewport is wide.
  size: "list" | "card" | "page";
};

// `card` is the only one that changes with the viewport, because the group's own
// card is the whole of a page's header on a phone and one item in a 288px rail
// at `lg`, where it matches the list's.
const BOX = {
  list: "size-14 rounded-xl",
  card: "size-16 rounded-xl lg:size-14",
  page: "size-24 rounded-xl",
} as const;

// Each token already carries its own weight, so the letter sets nothing beside
// it: a `font-semibold` next to one is two utilities for one property.
const TEXT = {
  list: "text-headline-sm",
  card: "text-headline-md lg:text-headline-sm",
  page: "text-headline-lg",
} as const;

/** Renders a group's photo over the letter that stands in for it. */
export function GroupAvatar({ name, photoUid, size }: Readonly<GroupAvatarProps>) {
  // `relative` is what the picture's own layer is positioned against, and
  // `overflow-hidden` is what rounds it off with the box.
  const shell = `bg-muted text-foreground ring-border/60 relative grid shrink-0 place-items-center overflow-hidden ring-1 ${BOX[size]}`;
  const src = groupPhotoSrc(photoUid);

  return (
    <span className={shell}>
      <span className={TEXT[size]} aria-hidden={src ? true : undefined}>
        {name.trim().charAt(0).toUpperCase()}
      </span>

      {/* Over the letter, which is what shows through when the bytes never
          arrive. The URL is the dynamic value an inline style is allowed. */}
      {src ? (
        <span
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${src}")` }}
        />
      ) : null}
    </span>
  );
}

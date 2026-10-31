/**
 * The search pill. The box keeps what is typed while the URL catches up a beat
 * later, so the spinner in place of the magnifier is the only sign of the wait.
 */

import { Loader2, Search, X } from "lucide-react";

type GroupSearchProps = {
  value: string;
  // The navigation the last keystroke started, which the URL has not finished.
  pending: boolean;
  onChange: (value: string) => void;
};

const FIELD =
  "bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-ring text-body-md min-h-11 w-full rounded-full border border-transparent pr-11 pl-10 focus-visible:ring-2 focus-visible:outline-none";

/** Renders the search box over the group list. */
export function GroupSearch({ value, pending, onChange }: Readonly<GroupSearchProps>) {
  return (
    <div className="relative sm:w-72 sm:shrink-0">
      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center">
        {pending ? (
          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
        ) : (
          <Search className="size-4" aria-hidden />
        )}
      </span>

      <input
        type="search"
        aria-label="Search groups"
        placeholder="Search groups"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        // The clear button below is ours, and WebKit draws its own inside the
        // field as soon as there is text in it.
        className={`${FIELD} [&::-webkit-search-cancel-button]:hidden`}
      />

      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex size-11 items-center justify-center rounded-full transition-colors"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/**
 * The board's search. A GET form so it still works with no JavaScript, with
 * the rest of the filter as hidden fields; with JavaScript the submit is
 * cancelled and the URL is replaced instead, a beat after typing stops.
 *
 * **Never `requestSubmit()` here.** A native GET submit is a document
 * navigation, so every keystroke reloaded the page and the arriving document
 * put its own older `q` back in the box. `router.replace` is what the group
 * list's search does, and it is why its box keeps up with typing.
 */

"use client";

import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { boardHref, carriedFields } from "@/lib/tasks/filter/filter";
import type { TaskQuery } from "@/lib/tasks/filter/filter.types";
import { QUERY_MAX_LENGTH } from "@/lib/validation/rules/rules";

type TaskSearchProps = {
  path: string;
  // The whole query: the hidden fields and the pushed URL are both built from
  // it, so the two paths cannot describe different boards.
  query: TaskQuery;
};

// Longer than the group list's 300ms: a task is searched for by phrase rather
// than by one word, so a mid-sentence pause should not cost a round trip.
const SETTLE_MS = 600;

const FIELD =
  "bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-ring text-body-md min-h-11 w-full rounded-full border border-transparent pr-11 pl-10 focus-visible:ring-2 focus-visible:outline-none";

/** Renders the search box over the board. */
export function TaskSearch({ path, query }: Readonly<TaskSearchProps>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(query.q);
  const [asked, setAsked] = useState(query.q);

  // The URL changing under us wins: a back press, or the clear link on the
  // empty card, has to put the box back rather than be pushed over by it. Not
  // while a push of ours is in flight, though: two searches a beat apart are
  // two navigations, and the earlier one landing second would rewrite the box
  // with the older text.
  if (query.q !== asked && !pending) {
    setAsked(query.q);
    setText(query.q);
  }

  /** Puts the box into the URL, which is what the board reads. */
  function push(next: string) {
    setAsked(next);
    startTransition(() => {
      router.replace(boardHref(path, query, { q: next }), { scroll: false });
    });
  }

  useEffect(() => {
    if (text === asked) return;

    const timer = setTimeout(() => push(text), SETTLE_MS);
    return () => clearTimeout(timer);
    // `push` is recreated every render and would restart the timer on each
    // keystroke's re-render, which is the debounce it is meant to serve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, asked]);

  /** Takes Enter without letting the browser navigate the document. */
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    push(text);
  }

  return (
    <form action={path} method="get" onSubmit={onSubmit} className="relative sm:w-72 sm:shrink-0">
      {carriedFields(query).map((field) => (
        <input key={`${field.name}:${field.value}`} type="hidden" {...field} />
      ))}

      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center">
        {pending ? (
          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
        ) : (
          <Search className="size-4" aria-hidden />
        )}
      </span>

      <input
        type="search"
        name="q"
        aria-label="Search tasks"
        placeholder="Search tasks"
        maxLength={QUERY_MAX_LENGTH}
        value={text}
        onChange={(event) => setText(event.target.value)}
        // The clear button below is ours, and WebKit draws its own inside the
        // field as soon as there is text in it.
        className={`${FIELD} [&::-webkit-search-cancel-button]:hidden`}
      />

      {text ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setText("")}
          className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex size-11 items-center justify-center rounded-full transition-colors"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </form>
  );
}

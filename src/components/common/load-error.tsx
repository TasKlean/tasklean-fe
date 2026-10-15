/**
 * What a screen shows when its data would not load. The backend's own message
 * is the useful half, so it is shown rather than lost behind the route
 * boundary, which exists for failures nobody anticipated.
 */

import { TriangleAlert } from "lucide-react";

type LoadErrorProps = {
  title: string;
  message?: string | null;
};

/** Renders a failed load inline, keeping the rest of the page usable. */
export function LoadError({ title, message }: LoadErrorProps) {
  return (
    <div
      role="alert"
      className="bg-destructive-subtle text-destructive-subtle-foreground p-space-lg gap-space-sm flex items-start rounded-xl"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />

      <div className="gap-space-xs flex min-w-0 flex-col">
        <p className="text-label-lg">{title}</p>
        {message ? <p className="text-body-md break-words">{message}</p> : null}
      </div>
    </div>
  );
}

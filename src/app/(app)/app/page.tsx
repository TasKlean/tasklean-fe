import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

/** Renders the signed-in landing page, a placeholder until groups exist. */
export default function AppHomePage() {
  return (
    <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-2xl gap-space-md mx-auto flex flex-col">
      <h1 className="text-display-lg-mobile md:text-headline-lg text-foreground">
        You&apos;re signed in
      </h1>
      <p className="text-body-lg text-muted-foreground max-w-prose">
        Nothing lives here yet. Groups, tasks and the rest arrive next; for now this page exists to
        prove the session holds and to give logout somewhere to sit.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { BackLink } from "@/components/auth/back-link";
import { JoinGroupForm } from "@/components/app/groups/join-group-form/join-group-form";

export const metadata: Metadata = {
  title: "Join a group",
};

/** Renders the join-by-code screen. */
export default function JoinGroupPage() {
  return (
    <div className="px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl gap-space-lg mx-auto flex w-full max-w-2xl flex-col">
      <BackLink href="/app" label="Back to your groups" />

      <header className="gap-space-xs flex flex-col">
        <h1 className="text-headline-md md:text-headline-lg text-foreground">Join a group</h1>
        <p className="text-body-md text-muted-foreground">
          The code is the invitation, so nobody has to approve you. You join as a member.
        </p>
      </header>

      <JoinGroupForm />
    </div>
  );
}

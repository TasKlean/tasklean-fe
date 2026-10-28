import type { Metadata } from "next";
import { BackLink } from "@/components/auth/back-link";
import { CreateGroupForm } from "@/components/app/create-group-form/create-group-form";

export const metadata: Metadata = {
  title: "Create a group",
};

/** Renders the create-group screen. */
export default function NewGroupPage() {
  return (
    <div className="px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl gap-space-lg mx-auto flex w-full max-w-2xl flex-col">
      <BackLink href="/app" label="Back to your groups" />

      <header className="gap-space-xs flex flex-col">
        <h1 className="text-headline-md md:text-headline-lg text-foreground">Create a group</h1>
        <p className="text-body-md text-muted-foreground">
          You become its admin, and you get an invite code to share with everyone else.
        </p>
      </header>

      <CreateGroupForm />
    </div>
  );
}

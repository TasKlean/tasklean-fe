/**
 * The Google option under a credentials form: the rule, the widget, and the
 * room around them. A Server Component, so the client id is read here and
 * handed down rather than reaching the browser on its own.
 */

import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/common/or-divider";
import { getEnv } from "@/lib/config/env";

type GoogleSignInProps = {
  intent: "signin" | "signup";
  // From Proxy. Without it the widget could only mint a token the backend
  // will reject, so the whole option stays hidden.
  nonceHash: string | null;
  next?: string;
};

/** Renders the Google alternative, or nothing when no nonce was issued. */
export function GoogleSignIn({ intent, nonceHash, next }: GoogleSignInProps) {
  if (!nonceHash) return null;

  return (
    <div className="gap-space-lg py-space-md flex flex-col">
      <OrDivider />

      <GoogleButton
        clientId={getEnv().NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        intent={intent}
        next={next}
        nonceHash={nonceHash}
      />
    </div>
  );
}

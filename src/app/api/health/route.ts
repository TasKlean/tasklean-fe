/**
 * The liveness endpoint Render polls. Deliberately dumb: no session, no
 * backend call, so a slow API can never make a healthy container look dead.
 * `/api` is outside Proxy's matcher, so this answers without the auth boundary.
 */

import { NextResponse } from "next/server";

/** Reports that the server is up. */
export function GET(): NextResponse {
  return NextResponse.json({ status: "ok" });
}

/**
 * The notification matrix: a draft the page holds, saved in one press. The
 * switches are checkboxes, so a save with scripting off posts exactly what
 * they show; only the column switches need JavaScript.
 */

"use client";

import { useActionState, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  type NotificationsActionState,
  saveNotificationsAction,
} from "@/app/(app)/app/settings/notifications/actions/actions";
import { NotificationToggle } from "@/components/app/notification-toggle";
import { SwitchTrack } from "@/components/app/switch-track/switch-track";
import { FormNotice } from "@/components/common/form-notice";
import { SubmitButton } from "@/components/common/submit-button";
import {
  changedTypes,
  type NotificationChannel,
  NOTIFICATION_CHANNELS,
  type NotificationMatrix,
  type NotificationType,
  NOTIFICATION_TYPES,
  toggled,
  withChannel,
} from "@/lib/notifications/settings/settings.types";

type NotificationsFormProps = {
  settings: NotificationMatrix;
};

const INITIAL: NotificationsActionState = { error: null };

// The sections, in the order they appear.
const GROUPS = ["Tasks", "Groups"] as const;

type Group = (typeof GROUPS)[number];

// Every type names its section, so a type added later cannot quietly fall off
// the page: it fails to compile until it has one.
const SECTION_OF: Record<NotificationType, Group> = {
  TASK_ASSIGNED: "Tasks",
  TASK_COMPLETED: "Tasks",
  TASK_REMINDER: "Tasks",
  MEMBER_JOINED: "Groups",
};

const LABELS: Record<NotificationType, string> = {
  TASK_ASSIGNED: "Task assigned to me",
  TASK_COMPLETED: "Task completed",
  TASK_REMINDER: "Task reminders",
  MEMBER_JOINED: "New member joined",
};

const CHANNELS: Record<NotificationChannel, string> = {
  inApp: "In app",
  email: "Email",
};

// Matches the rows below, so every column lines up. No gap and no alignment
// here: a gap narrows the 1fr, and alignment would beat what each row sets.
const COLUMNS = "sm:grid sm:grid-cols-[1fr_auto_auto] sm:gap-0";

const CELL = "gap-space-xs flex items-center sm:w-20 sm:justify-center";

const COLUMN_SWITCH =
  "focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

/** Renders every section, its switches, and the save they all share. */
export function NotificationsForm({ settings }: Readonly<NotificationsFormProps>) {
  const [state, formAction, pending] = useActionState(saveNotificationsAction, INITIAL);
  const [draft, setDraft] = useState(settings);
  const [handled, setHandled] = useState(state);

  const saved = state.settings ?? settings;

  // Adjusted in render rather than in an effect, the way React prescribes. A
  // refused save keeps the draft, so nothing is lost before a retry.
  if (handled !== state) {
    setHandled(state);
    if (state.settings) setDraft(state.settings);
  }

  const dirty = changedTypes(saved, draft).length > 0;

  return (
    // React resets the form once the action answers, which would put every
    // checkbox back where the page loaded it: the draft is state.
    <form
      action={formAction}
      onReset={(event) => event.preventDefault()}
      className="gap-space-md flex flex-col"
    >
      {state.error ? <FormNotice tone="error">{state.error}</FormNotice> : null}

      {dirty ? (
        <FormNotice tone="info">
          You have unsaved changes. Press Save changes to keep them.
        </FormNotice>
      ) : null}

      {state.done && !state.error && !dirty ? (
        <FormNotice tone="success">Your notification choices are saved.</FormNotice>
      ) : null}

      <div className={`gap-space-lg px-space-md flex justify-end ${COLUMNS} sm:items-end`}>
        <span className="hidden sm:block" />

        {NOTIFICATION_CHANNELS.map((channel) => {
          const anyOn = NOTIFICATION_TYPES.some((type) => draft[type][channel]);

          return (
            <span key={channel} className={`${CELL} sm:flex-col sm:gap-0`}>
              <span className="text-label-sm text-muted-foreground">{CHANNELS[channel]}</span>

              <button
                type="button"
                role="switch"
                aria-checked={anyOn}
                aria-label={`Turn ${CHANNELS[channel].toLowerCase()} ${
                  anyOn ? "off" : "on"
                } for every notification`}
                disabled={pending}
                onClick={() => setDraft(withChannel(draft, channel, !anyOn))}
                className={COLUMN_SWITCH}
              >
                <SwitchTrack on={anyOn} />
              </button>
            </span>
          );
        })}
      </div>

      {GROUPS.map((group) => {
        const types = NOTIFICATION_TYPES.filter((type) => SECTION_OF[type] === group);
        if (types.length === 0) return null;

        return (
          <details key={group} className="bg-card border-border/60 group rounded-xl border">
            <summary className="px-space-md py-space-xs flex cursor-pointer list-none items-center rounded-xl [&::-webkit-details-marker]:hidden">
              <span className={`w-full ${COLUMNS} sm:items-center`}>
                <span className="gap-space-xs text-label-lg text-foreground flex min-h-11 items-center">
                  <ChevronRight
                    className="text-muted-foreground size-4 transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                  {group}
                </span>

                <span className="hidden sm:contents">
                  {NOTIFICATION_CHANNELS.map((channel) => {
                    const on = types.filter((type) => draft[type][channel]).length;

                    return (
                      <span key={channel} className={`${CELL} text-label-sm text-muted-foreground`}>
                        <span className="sr-only">
                          {`${on} of ${types.length} ${CHANNELS[channel].toLowerCase()}`}
                        </span>
                        <span aria-hidden>{`${on}/${types.length}`}</span>
                      </span>
                    );
                  })}
                </span>
              </span>
            </summary>

            <ul className="divide-border/60 border-border/60 px-space-md py-space-sm divide-y border-t">
              {types.map((type) => (
                <li key={type} className="py-space-sm first:pt-0 last:pb-0">
                  <div
                    className={`gap-space-md flex items-center justify-between ${COLUMNS} sm:items-center`}
                  >
                    <span className="text-label-lg text-foreground min-w-0">{LABELS[type]}</span>

                    <div className="gap-space-md flex shrink-0 items-center sm:contents">
                      {NOTIFICATION_CHANNELS.map((channel) => (
                        <span key={channel} className={CELL}>
                          <span className="text-label-sm text-muted-foreground sm:hidden">
                            {CHANNELS[channel]}
                          </span>

                          <NotificationToggle
                            channel={channel}
                            type={type}
                            label={`${LABELS[type]}, ${CHANNELS[channel].toLowerCase()}`}
                            on={draft[type][channel]}
                            disabled={pending}
                            onFlip={() => setDraft(toggled(draft, type, channel))}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        );
      })}

      <SubmitButton disabled={!dirty} pendingLabel="Saving your choices…">
        Save changes
      </SubmitButton>
    </form>
  );
}

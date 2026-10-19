/**
 * One channel switch. A real checkbox under the paint, so the browser keeps
 * the state, the keyboard works for free and a save with scripting off
 * submits exactly what the boxes show.
 */

import { SwitchTrack } from "@/components/app/switch-track";
import type { NotificationChannel, NotificationType } from "@/lib/notifications/settings.types";

type NotificationToggleProps = {
  // The field name is the channel, and the value is the type, so the form
  // submits one list of types per channel.
  channel: NotificationChannel;
  type: NotificationType;
  // The accessible name, since the row and column labels are not read together.
  label: string;
  on: boolean;
  disabled: boolean;
  onFlip: () => void;
};

/** Renders a switch for one type and channel. */
export function NotificationToggle({
  channel,
  type,
  label,
  on,
  disabled,
  onFlip,
}: NotificationToggleProps) {
  return (
    <label className="has-[:focus-visible]:ring-ring flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md has-[:focus-visible]:ring-2">
      <input
        type="checkbox"
        role="switch"
        name={channel}
        value={type}
        checked={on}
        disabled={disabled}
        onChange={onFlip}
        aria-label={label}
        className="peer sr-only"
      />

      <SwitchTrack />
    </label>
  );
}

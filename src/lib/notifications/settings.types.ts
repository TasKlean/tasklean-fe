/**
 * The `/api/notification-settings` contract: the types the backend can notify
 * about, the channels each one has, and the defaults a never-saved type comes
 * back as. No `server-only` here, because the form and its schema read the
 * lists too.
 */

// Enum names, not display values. The order is the order the rows appear in.
export const NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "TASK_COMPLETED",
  "TASK_REMINDER",
  "MEMBER_JOINED",
] as const;

// Request field names, which are also the columns the form offers. Push is not
// one of them: the device table holds tokens, but the contract has no channel.
export const NOTIFICATION_CHANNELS = ["inApp", "email"] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type NotificationChannels = Record<NotificationChannel, boolean>;

// Keyed rather than listed: the backend answers with every type, and building
// it from our own list means a row can never be missing.
export type NotificationMatrix = Record<NotificationType, NotificationChannels>;

// The batch body's entry: the same shape a response carries, with the type in
// the body rather than in the path.
export type NotificationSettingEntry = NotificationChannels & {
  type: NotificationType;
};

// Nothing is marked `required` in openapi.json, so a response is narrowed
// rather than trusted.
export type NotificationSettingResponse = {
  type?: string;
  inApp?: boolean;
  email?: boolean;
};

/** Mirrors the backend's own defaults for a type nobody has saved yet. */
export const DEFAULT_CHANNELS: NotificationChannels = {
  inApp: true,
  email: true,
};

/** Narrows one entry's channels, defaulting anything that is not a boolean. */
export function asChannels(
  response: NotificationSettingResponse | undefined,
): NotificationChannels {
  return {
    inApp: typeof response?.inApp === "boolean" ? response.inApp : DEFAULT_CHANNELS.inApp,
    email: typeof response?.email === "boolean" ? response.email : DEFAULT_CHANNELS.email,
  };
}

/**
 * Inverts one channel of one type.
 *
 * @returns A new matrix. Shared by the action, which saves the result, and the
 * form, which paints it before the answer arrives, so the two cannot disagree.
 */
export function toggled(
  matrix: NotificationMatrix,
  type: NotificationType,
  channel: NotificationChannel,
): NotificationMatrix {
  return { ...matrix, [type]: { ...matrix[type], [channel]: !matrix[type][channel] } };
}

/**
 * Sets one channel the same way on every type.
 *
 * @returns A new matrix. Shared by the action, which writes it, and the strip
 * of column buttons, which paints it on the press.
 */
export function withChannel(
  matrix: NotificationMatrix,
  channel: NotificationChannel,
  enabled: boolean,
): NotificationMatrix {
  const next = { ...matrix };
  for (const type of NOTIFICATION_TYPES) {
    next[type] = { ...next[type], [channel]: enabled };
  }
  return next;
}

/**
 * Builds a matrix from the types a form reported as checked.
 *
 * @param checked One list per channel. Anything absent from a list is off,
 * which is what an unchecked box submits: nothing at all.
 */
export function matrixFrom(checked: Record<NotificationChannel, string[]>): NotificationMatrix {
  // The cast is `fromEntries` widening the key back to string; the map runs
  // over our own list, so every type is present.
  return Object.fromEntries(
    NOTIFICATION_TYPES.map((type) => [
      type,
      { inApp: checked.inApp.includes(type), email: checked.email.includes(type) },
    ]),
  ) as NotificationMatrix;
}

/** Lists the types whose channels differ between two matrices. */
export function changedTypes(
  current: NotificationMatrix,
  next: NotificationMatrix,
): NotificationType[] {
  return NOTIFICATION_TYPES.filter((type) =>
    NOTIFICATION_CHANNELS.some((channel) => current[type][channel] !== next[type][channel]),
  );
}

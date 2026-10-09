/**
 * Reads string fields out of a `FormData`. Trimming is a separate function
 * rather than an option, so the one place it must not happen — a password,
 * which has to reach the backend exactly as typed — says so at the call site.
 */

type Fields<K extends string> = Record<K, string>;

function read<K extends string>(formData: FormData, keys: readonly K[], trim: boolean): Fields<K> {
  const fields = {} as Fields<K>;
  for (const key of keys) {
    const value = formData.get(key);
    // A File entry becomes "", not "[object File]" as String() would give.
    const text = typeof value === "string" ? value : "";
    fields[key] = trim ? text.trim() : text;
  }
  return fields;
}

/** Reads the named fields, trimmed. */
export function readTrimmed<K extends string>(formData: FormData, keys: readonly K[]): Fields<K> {
  return read(formData, keys, true);
}

/** Reads the named fields exactly as submitted. */
export function readRaw<K extends string>(formData: FormData, keys: readonly K[]): Fields<K> {
  return read(formData, keys, false);
}

/**
 * The top bar of the form for a task that does not exist yet: what it is, and
 * the one press that writes it down.
 *
 * No Discard and no byline, which are both about a task there already is. The
 * ways out are the panel's own close and the footer's Cancel.
 */

import { BAR_SUBMIT } from "@/components/app/group/board/task-panel/task-form/task-form.styles";

type CreateHeaderProps = {
  // The form these presses submit, which sits below this bar rather than
  // around it.
  formId: string;
  saving: boolean;
};

// The form's own words, read by the panel's name and the footer's press too.
export const CREATE_HEADING = "New task";

export const CREATE_SUBMIT = "Add task";

/** Renders the top bar of a task being created. */
export function CreateHeader({ formId, saving }: Readonly<CreateHeaderProps>) {
  return (
    <div className="gap-space-sm flex min-w-0 flex-1 items-center justify-between">
      <h2 className="text-label-lg text-foreground truncate">{CREATE_HEADING}</h2>

      <button type="submit" form={formId} disabled={saving} className={BAR_SUBMIT}>
        {saving ? "Saving..." : CREATE_SUBMIT}
      </button>
    </div>
  );
}

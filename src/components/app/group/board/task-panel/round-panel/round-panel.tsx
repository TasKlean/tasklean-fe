/**
 * The panel one recorded round is read in. A fourth shape beside the reader,
 * the editor and the round being recorded, and the only one with nothing to
 * press: a round is a fact, not a thing to change.
 *
 * `?round=` is what holds it open, so the way back is a link and the panel
 * survives a reload. Nothing of this is a client component.
 */

import { SidePanel } from "@/components/common/side-panel/side-panel";
import { RoundView } from "@/components/app/group/board/task-panel/round-panel/round-view";
import type { TaskCompletion } from "@/lib/tasks/completions/completions.types";

type RoundPanelProps = {
  round: TaskCompletion;
  // The task's own name, which is what the panel is announced as: the round
  // is a page of that task rather than a thing of its own.
  label: string;
  // Back to the task's facts, with the board's filter still on it.
  backHref: string;
  now: Date;
  timeZone: string;
};

const KIND = "text-label-md text-muted-foreground truncate uppercase";

/** Renders one round of a task, with the way back to the task. */
export function RoundPanel({ round, label, backHref, now, timeZone }: Readonly<RoundPanelProps>) {
  return (
    <SidePanel
      label={label}
      close={{ href: backHref, back: true }}
      dismissable
      header={<span className={KIND}>Recorded round</span>}
    >
      <RoundView round={round} now={now} timeZone={timeZone} />
    </SidePanel>
  );
}

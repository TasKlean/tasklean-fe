/**
 * What each field of the task form is for, in one line each. One place rather
 * than a sentence at every call site, because the form is three components and
 * the wording is read together.
 */

export const FIELD_INFO = {
  category: "Which kind of work this is, so the task can be found and filtered.",
  description: "More about what has to be done. Several lines are fine.",
  assignee: "Who this round is for. Left empty, anybody in the group can do it.",
  owner:
    "Whose task this normally is: every round comes back to them once the last one is done. Left empty, a finished round leaves the task open to anybody.",
  recurrence: "Brings the task back every day, week or month. It needs a due date.",
  priority: "How urgent the task is.",
  dueDate: "The day the task should be done by.",
  dueTime: "The time that day it should be done by. Empty means any time that day.",
  estimate: "Roughly how long it takes, so whoever does it knows the size of the job.",
  image: "A picture of what the task is about, so members can see what is meant.",
  tags: "A word or two more about the task, to group it with others like it.",
  photoProof: "Whoever does it has to upload a picture showing it is done.",
} as const;

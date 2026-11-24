/**
 * What each field of the chore form is for, in one line each. One place rather
 * than a sentence at every call site, because the form is three components and
 * the wording is read together.
 */

export const FIELD_INFO = {
  category: "Which kind of work this is, so the chore can be found and filtered.",
  description: "More about what has to be done. Several lines are fine.",
  assignee: "Give the chore to one member, or leave it for anybody in the group.",
  recurrence: "Brings the chore back every day, week or month. It needs a due date.",
  priority: "How urgent the chore is.",
  dueDate: "The day the chore should be done by.",
  dueTime: "The time that day it should be done by. Empty means any time that day.",
  estimate: "Roughly how long it takes, so whoever does it knows the size of the job.",
  image: "A picture of what the chore is about, so members can see what is meant.",
  tags: "A word or two more about the chore, to group it with others like it.",
  photoProof: "Whoever does it has to upload a picture showing it is done.",
} as const;

/**
 * What each field of the completion view is for, in one line each, drawn by
 * the (i) beside its name rather than as a line under it.
 */

export const ROUND_INFO = {
  minutes: "How long this round actually took. Left empty, the task's own estimate is counted.",
  note: "Anything worth saying about this round, which everybody in the group can read.",
  photo: "A picture of the finished work, so the group can see it was done.",
} as const;

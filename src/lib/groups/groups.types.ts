/**
 * The group and membership wire shapes, hand-written from `docs/openapi.json`.
 * Everything is addressed by `uid`: the numeric ids these responses once
 * carried are gone from the contract, memberships included.
 */

// Per-group, never per-account: the same user can administer one group and be a
// plain member of another. Read by `validation/rules`, so no `server-only` here.
export const GROUP_ROLES = ["GROUP_ADMIN", "GROUP_MEMBER"] as const;

export type GroupRole = (typeof GROUP_ROLES)[number];

// Nothing is marked `required` in openapi.json, so nothing may be assumed
// present. `inviteCode` is absent for anyone but that group's admin.
export type Group = {
  uid?: string;
  name?: string;
  description?: string;
  photoUrl?: string;
  inviteCode?: string;
  // Whatever the backend's enum holds, narrowed where it is read: a role we do
  // not recognise must not pass for an admin.
  myRole?: string;
  memberCount?: number;
  isActive?: boolean;
  dateCreated?: string;
  dateUpdated?: string;
};

// A row from `/mine`, or the group a join answered with. `isActive` goes,
// because the list only ever holds groups you are an active member of.
export type MyGroup = Omit<Group, "isActive"> & {
  dateJoined?: string;
};

// The display fields a membership carries its user by. Deliberately no email:
// an invite code admits whoever holds it, so the roster shows no addresses.
export type GroupMemberUser = {
  uid?: string;
  name?: string;
  lastName?: string;
  photoUrl?: string;
};

export type GroupMember = {
  uid?: string;
  role?: string;
  isActive?: boolean;
  dateJoined?: string;
  dateLeft?: string;
  user?: GroupMemberUser;
  // The columns exist and nothing writes them yet, so both are null on every
  // row. Nothing may be built on them landing.
  addedBy?: GroupMemberUser;
  removedBy?: GroupMemberUser;
};

// `photoUrl` is a link somebody pasted: there is no uploader or image storage
// anywhere in the product, so a URL is the only picture a group can have.
export type GroupDetailsRequest = {
  name: string;
  description?: string;
  photoUrl?: string;
};

export type JoinGroupRequest = {
  inviteCode: string;
};

export type MemberRoleRequest = {
  role: GroupRole;
};

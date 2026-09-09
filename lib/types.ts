export type UserPublic = {
  id: string;
  name: string;
  color: string;
};

export type EntryStatus = "Confirmed" | "Tentative";

export type EntryPublic = {
  id: string;
  startDate: string;
  endDate: string;
  status: EntryStatus;
  hasGuests: boolean;
  notes: string;
  userIds: string[];
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LogAction = "Create" | "Update" | "Delete";

export type FieldChange = {
  field: string;
  old: unknown;
  new: unknown;
};

export type ActivityLogPublic = {
  id: string;
  actorId: string;
  actorName: string;
  action: LogAction;
  entryId: string | null;
  summary: string;
  changes: FieldChange[] | Record<string, unknown>;
  createdAt: string;
};

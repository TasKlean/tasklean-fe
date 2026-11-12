import { describe, expect, it } from "vitest";
import { auditEntityType, groupEntityType } from "@/lib/audit/entity/entity";

describe("auditEntityType", () => {
  it("refuses a value the backend would answer with a 400", () => {
    expect(auditEntityType("TASKS")).toBeNull();
    expect(auditEntityType("task")).toBeNull();
    expect(auditEntityType(null)).toBeNull();
  });

  it("accepts a type the trail records", () => {
    expect(auditEntityType("TASK_COMPLETION")).toBe("TASK_COMPLETION");
  });
});

describe("groupEntityType", () => {
  it("refuses USER, which a group's trail can never hold", () => {
    expect(auditEntityType("USER")).toBe("USER");
    expect(groupEntityType("USER")).toBeNull();
  });

  it("accepts a type a group's trail carries", () => {
    expect(groupEntityType("GROUP_MEMBER")).toBe("GROUP_MEMBER");
  });
});

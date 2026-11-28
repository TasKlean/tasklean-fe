import { describe, expect, it } from "vitest";
import { auditEntityType, groupEntityType, nameKey } from "@/lib/audit/entity/entity";

describe("auditEntityType", () => {
  it("refuses a value the backend would answer with a 400", () => {
    expect(auditEntityType("TASKS")).toBeNull();
    expect(auditEntityType("task")).toBeNull();
    expect(auditEntityType(null)).toBeNull();
  });

  it("accepts a type the trail records", () => {
    expect(auditEntityType("CATEGORY")).toBe("CATEGORY");
  });

  it("refuses the completion type the backend dropped", () => {
    expect(auditEntityType("TASK_COMPLETION")).toBeNull();
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

describe("nameKey", () => {
  it("keeps a category and a tag apart, which number themselves separately", () => {
    expect(nameKey("CATEGORY", "3")).not.toBe(nameKey("TAG", "3"));
  });
});

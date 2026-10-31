// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextArea } from "@/components/common/text-area/text-area";

describe("TextArea", () => {
  it("counts what is typed against the limit", () => {
    render(<TextArea label="Description" name="description" maxLength={500} value="Flat 12" />);

    expect(screen.getByText(/7 \/ 500/)).toBeInTheDocument();
  });

  it("counts nothing where there is no limit to count against", () => {
    render(<TextArea label="Description" name="description" value="Flat 12" />);

    expect(screen.queryByText(/\//)).toBeNull();
  });

  it("keeps the count out of the field's description, where it would chatter", () => {
    render(
      <TextArea label="Description" name="description" hint="Optional." maxLength={500} value="" />,
    );

    expect(screen.getByLabelText("Description")).toHaveAttribute(
      "aria-describedby",
      "description-hint",
    );
  });
});

// @vitest-environment jsdom

import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroTilt } from "@/components/marketing/hero-tilt/hero-tilt";

function setReducedMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function renderStage() {
  const view = render(
    <HeroTilt photo={<div data-testid="photo" />} card={<div data-testid="card" />} />,
  );
  const stage = view.container.querySelector(".transform-3d") as HTMLElement;
  const floater = stage.lastElementChild as HTMLElement;
  const root = view.container.firstElementChild as HTMLElement;

  root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 400 }) as DOMRect;

  return { root, stage, floater };
}

function movePointer(root: HTMLElement, x: number, y: number, pointerType = "mouse") {
  fireEvent.pointerMove(root, { clientX: x, clientY: y, pointerType });
}

describe("HeroTilt", () => {
  beforeEach(() => {
    setReducedMotion(false);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores touch, which has no hover state", () => {
    const { root, stage } = renderStage();
    movePointer(root, 0, 0, "touch");
    expect(stage.style.transform).toBe("");
  });

  it("stays still when reduced motion is requested", () => {
    setReducedMotion(true);
    const { root, stage } = renderStage();
    movePointer(root, 0, 0);
    expect(stage.style.transform).toBe("");
  });
});

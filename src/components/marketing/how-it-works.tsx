/**
 * The path from signing up to a working household. Each step maps to an
 * endpoint that already exists, so the page promises no onboarding we lack.
 */

import { ArrowRight } from "lucide-react";

type Step = {
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: "Create your group",
    body: "Sign up and name the place you share. One group is enough to start, and you can add more later.",
  },
  {
    title: "Share the code",
    body: "Every group has a single invite code. Send it once and the people you live with join themselves.",
  },
  {
    title: "Add the first few tasks",
    body: "Give each one an owner, set the ones that repeat, and the week starts keeping itself.",
  },
];

/** Renders the three-step explanation of getting started. */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-2xl lg:py-space-3xl mx-auto w-full scroll-mt-20"
    >
      <h2 className="text-headline-lg text-primary-strong mb-space-2xl mx-auto max-w-2xl text-center">
        Three steps and the house is running itself
      </h2>

      <ol className="gap-space-lg flex flex-col md:flex-row">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative flex-1">
            <div className="bg-card shadow-level-1 p-space-lg gap-space-sm hover:shadow-level-2 flex h-full flex-col items-center rounded-xl text-center transition duration-300 ease-out motion-safe:hover:-translate-y-1">
              <span
                aria-hidden
                className="bg-primary text-primary-foreground text-label-lg flex size-10 items-center justify-center rounded-full"
              >
                {index + 1}
              </span>
              <h3 className="text-headline-sm text-primary-strong">{step.title}</h3>
              <p className="text-body-md text-muted-foreground">{step.body}</p>
            </div>

            {/* Sits in the flex gap, so it turns with the stack rather than moving. */}
            {index < STEPS.length - 1 ? (
              <ArrowRight
                aria-hidden
                className="text-primary absolute top-full left-1/2 size-5 -translate-x-1/2 rotate-90 md:top-1/2 md:left-full md:translate-x-0 md:-translate-y-1/2 md:rotate-0"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

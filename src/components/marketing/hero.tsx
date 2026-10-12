/**
 * The home page's opening section: headline, photo, and a sample task list
 * built from tokens rather than a screenshot, so the mock cannot go stale.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Check, Repeat2, Sparkles } from "lucide-react";

import heroImage from "@/assets/home-hero.webp";
import { HeroTilt } from "@/components/marketing/hero-tilt";

/** Renders the hero section. */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-accent/40 pointer-events-none absolute -top-40 left-1/2 h-72 w-192 -translate-x-1/2 rounded-full blur-3xl"
      />

      <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop pt-space-2xl pb-space-2xl lg:pt-space-3xl lg:pb-space-3xl relative mx-auto">
        <div className="gap-space-md mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-label-md bg-muted text-link px-space-md py-space-xs gap-space-xs inline-flex items-center rounded-full uppercase">
            <Sparkles className="size-4" aria-hidden />
            The shared home method
          </p>

          <h1 className="text-display-lg-mobile sm:text-display-lg text-primary-strong">
            Clean tasks, clear minds.
          </h1>

          <p className="text-body-lg text-muted-foreground max-w-2xl">
            A calm task manager for families, couples and roommates. Everyone sees what needs doing
            and who has it, so nobody has to carry the whole house in their head.
          </p>

          <div className="gap-space-sm sm:gap-space-md mt-space-xs flex w-full flex-col sm:w-auto sm:flex-row">
            <Link
              href="/register"
              className="text-label-lg bg-primary text-primary-foreground hover:bg-primary-strong px-space-xl shadow-level-2 gap-space-xs inline-flex min-h-12 items-center justify-center rounded-full transition-colors"
            >
              Create your group
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/login"
              className="text-label-lg bg-card text-primary-strong hover:bg-muted px-space-lg shadow-level-1 inline-flex min-h-12 items-center justify-center rounded-full transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <HeroTilt
          photo={
            /* `priority` because this is the page's largest paint on every screen. */
            <Image
              src={heroImage}
              alt="A bright open-plan living room and kitchen, tidy, with someone reading on the sofa"
              placeholder="blur"
              priority
              sizes="(min-width: 64rem) 56rem, 100vw"
              className="shadow-level-2 h-auto w-full rounded-xl"
            />
          }
          card={<HeroMock />}
        />
      </div>
    </section>
  );
}

/** Renders a static sample of a household's task list. */
function HeroMock() {
  return (
    <div
      aria-hidden
      className="bg-card shadow-level-3 p-space-md sm:p-space-lg gap-space-md flex flex-col rounded-xl"
    >
      <div className="gap-space-sm flex items-center justify-between">
        <p className="text-label-md text-muted-foreground uppercase">Today · The Flat</p>
        <p className="text-label-sm bg-success-subtle text-success-subtle-foreground px-space-sm py-space-xs rounded-full">
          4 of 5 done
        </p>
      </div>

      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-success h-full w-4/5 rounded-full" />
      </div>

      <ul className="gap-space-sm flex flex-col">
        <MockTask title="Dishes & wipe countertops" who="Alex" note="Photo proof" done />
        <MockTask title="Water the plants" who="Mina" note="Every 3 days" done />
        <MockTask title="Take out recycling" who="You" note="Tonight" />
      </ul>
    </div>
  );
}

type MockTaskProps = {
  title: string;
  who: string;
  note: string;
  done?: boolean;
};

/** Renders one row of the sample task list. */
function MockTask({ title, who, note, done = false }: MockTaskProps) {
  return (
    <li className="bg-background gap-space-sm p-space-sm flex items-center rounded-md">
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-success text-success-foreground" : "border-border border-2"
        }`}
      >
        {done ? <Check className="size-4" /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`text-body-md block truncate ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {title}
        </span>
        <span className="text-label-sm text-muted-foreground gap-space-xs flex items-center">
          {who}
          <span>·</span>
          {note === "Photo proof" ? <Camera className="size-3" /> : null}
          {note.startsWith("Every") ? <Repeat2 className="size-3" /> : null}
          {note}
        </span>
      </span>
    </li>
  );
}

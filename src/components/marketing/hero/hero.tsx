/**
 * The home page's opening section: headline, photo, and a sample task list
 * built from tokens rather than a screenshot, so the mock cannot go stale.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import heroImage from "@/assets/home-hero.webp";
import { HeroMock } from "@/components/marketing/hero/hero-mock";
import { HeroTilt } from "@/components/marketing/hero-tilt/hero-tilt";

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

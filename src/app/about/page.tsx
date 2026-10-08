import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "What TasKlean is and who builds it.",
};

/** Renders the public about page. */
export default function AboutPage() {
  return (
    <div>
      <h1>About Page</h1>
      <p>This is the about page of our application.</p>
    </div>
  );
}

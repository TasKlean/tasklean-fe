type GreetingProps = {
  name: string | null;
  className?: string;
};

/** Renders a greeting, or nothing when the session carries no name. */
export function Greeting({ name, className }: Readonly<GreetingProps>) {
  if (!name) return null;

  return (
    <span className={className}>
      Hello, <span className="text-foreground font-semibold">{name}</span>
    </span>
  );
}

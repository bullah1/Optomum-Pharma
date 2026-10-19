import { cn } from "@/lib/utils";

function Skeleton({
  className,
  delay = 0,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  return (
    <div
      className={cn("rounded-md bg-muted/50", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 25%, hsl(var(--muted-foreground) / 0.07) 50%, transparent 75%)",
        backgroundSize: "200% 100%",
        animation: `shimmer 1.5s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
      }}
      {...props}
    />
  );
}

export { Skeleton };

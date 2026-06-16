import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md",
        className
      )}
      style={{
        background: "linear-gradient(90deg, #1a1a1a08 25%, #1a1a1a10 50%, #1a1a1a08 75%)",
        backgroundSize: "200% 100%",
        animation: "mag-skeleton-shimmer 1.5s ease-in-out infinite",
      }}
      {...props}
    />
  )
}

export { Skeleton }

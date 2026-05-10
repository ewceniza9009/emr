import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-300 dark:bg-white/10 border border-black/10 dark:border-white/5",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 dark:via-white/40 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

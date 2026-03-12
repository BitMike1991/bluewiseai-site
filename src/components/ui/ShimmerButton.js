import { cn } from "@/lib/utils"

export function ShimmerButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-lg",
        "px-6 py-3 font-semibold text-white transition-all duration-300",
        "bg-accent hover:bg-accent/90",
        "shadow-[0_0_20px_rgba(108,99,255,0.3)]",
        "hover:shadow-[0_0_30px_rgba(108,99,255,0.5)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 overflow-hidden rounded-lg">
        <span
          className="absolute inset-0 animate-shimmer"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            backgroundSize: '200% 100%',
          }}
        />
      </span>
      <span className="relative z-10">{children}</span>
    </button>
  )
}

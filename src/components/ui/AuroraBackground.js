import { cn } from "@/lib/utils"

export function AuroraBackground({ children, className }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute -inset-[10px] opacity-50",
            "[background-image:var(--aurora)]",
            "[background-size:300%,_200%]",
            "[background-position:50%_50%,50%_50%]",
            "filter blur-[10px]",
            "after:content-[''] after:absolute after:inset-0",
            "after:[background-image:var(--aurora)]",
            "after:[background-size:200%,_100%]",
            "after:animate-aurora after:mix-blend-difference",
            "after:[background-attachment:fixed]"
          )}
          style={{
            '--aurora':
              'repeating-linear-gradient(100deg, #6c63ff15 10%, #00d4aa10 15%, #6c63ff10 20%, #00d4aa15 25%, #6c63ff15 30%)',
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

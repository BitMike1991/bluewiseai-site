import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function MovingBorder({
  children,
  duration = 2000,
  className,
  containerClassName,
  borderClassName,
  as: Component = "div",
  ...props
}) {
  return (
    <Component
      className={cn(
        "relative overflow-hidden rounded-xl p-[1px] bg-transparent",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-xl",
          borderClassName
        )}
        style={{
          background: `linear-gradient(var(--angle, 0deg), #6c63ff, #00d4aa, #6c63ff)`,
          animation: `spin ${duration}ms linear infinite`,
        }}
      />
      <div
        className={cn(
          "relative rounded-xl bg-surface",
          className
        )}
      >
        {children}
      </div>
      <style jsx>{`
        @keyframes spin {
          from { --angle: 0deg; }
          to { --angle: 360deg; }
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
    </Component>
  )
}

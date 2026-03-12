import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { GlowCard } from "./GlowCard"

function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) {
      setCount(0)
      return
    }
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return count
}

export function StatCard({ label, value, change, changeType = "neutral", color, numericValue }) {
  const animatedValue = useCountUp(numericValue, 800)

  return (
    <GlowCard glowColor={color ? `${color}22` : undefined}>
      <div className="text-xs text-txt3 mb-1.5">{label}</div>
      <div
        className="text-3xl font-bold tabular-nums"
        style={{ color: color || 'var(--text)' }}
      >
        {numericValue !== undefined ? animatedValue : value}
      </div>
      {change && (
        <div className={cn(
          "text-xs mt-1",
          changeType === 'up' && 'text-success',
          changeType === 'down' && 'text-danger',
          changeType === 'neutral' && 'text-txt2',
        )}>
          {change}
        </div>
      )}
    </GlowCard>
  )
}

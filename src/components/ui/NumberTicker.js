import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

export function NumberTicker({ value, prefix = "", suffix = "", duration = 1200, className }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, ''))
    if (isNaN(numericValue)) return

    let start = 0
    const step = numericValue / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= numericValue) {
        setCount(numericValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start * 10) / 10)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, value, duration])

  const isDecimal = String(value).includes('.')
  const display = isDecimal ? count.toFixed(1) : Math.floor(count).toLocaleString()

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}{display}{suffix}
    </span>
  )
}

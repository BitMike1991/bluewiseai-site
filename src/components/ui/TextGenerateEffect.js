import { cn } from "@/lib/utils"

export function TextGenerateEffect({ words, className, duration = 0.8 }) {
  const wordArray = words.split(" ")
  const delayPerWord = (duration * 1000) / wordArray.length

  return (
    <div className={cn("font-bold", className)}>
      {wordArray.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="inline-block mr-[0.3em] opacity-0 animate-fade-in"
          style={{
            animationDelay: `${idx * delayPerWord}ms`,
            animationFillMode: "forwards",
            animationDuration: "400ms",
          }}
        >
          {word}
        </span>
      ))}
    </div>
  )
}

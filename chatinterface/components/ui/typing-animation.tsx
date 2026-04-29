"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface TypingAnimationProps {
  text: string
  duration?: number
  showCursor?: boolean
  blinkCursor?: boolean
  cursorStyle?: "line" | "block" | "underscore"
  className?: string
  onComplete?: () => void
}

export function TypingAnimation({
  text,
  duration = 14,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = "line",
  className,
  onComplete,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText("")
    setIsComplete(false)
    indexRef.current = 0

    if (!text) return

    const graphemes = Array.from(text)

    const tick = () => {
      const i = indexRef.current
      if (i < graphemes.length) {
        setDisplayedText(graphemes.slice(0, i + 1).join(""))
        indexRef.current = i + 1
        timerRef.current = setTimeout(tick, duration)
      } else {
        setIsComplete(true)
        onComplete?.()
      }
    }

    timerRef.current = setTimeout(tick, duration)

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [text, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  const getCursorChar = () => {
    switch (cursorStyle) {
      case "block":
        return "▌"
      case "underscore":
        return "_"
      case "line":
      default:
        return "|"
    }
  }

  return (
    <div className={cn("whitespace-pre-wrap", className)}>
      {displayedText}
      {showCursor && !isComplete && (
        <span className={cn("inline-block", blinkCursor && "animate-blink-cursor")}>
          {getCursorChar()}
        </span>
      )}
    </div>
  )
}

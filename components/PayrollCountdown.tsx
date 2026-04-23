"use client"

import { useEffect, useRef, useState } from "react"

type Frequency = "daily" | "weekly" | "monthly"

export function PayrollCountdown({
  frequency = "monthly",
  onReadyChange,
}: {
  frequency?: Frequency
  onReadyChange?: (ready: boolean) => void
}) {
  const [timeLeft, setTimeLeft] = useState("")
  const [isReady, setIsReady] = useState(false)

  // prevent unnecessary callback spam
  const lastState = useRef<boolean | null>(null)

  const getNextResetDate = () => {
    const now = new Date()
    const next = new Date()

    if (frequency === "daily") {
      next.setDate(now.getDate() + 1)
      next.setHours(0, 0, 0, 0)
    }

    if (frequency === "weekly") {
      const day = now.getDay()
      const diff = (7 - day + 1) % 7 || 7
      next.setDate(now.getDate() + diff)
      next.setHours(0, 0, 0, 0)
    }

    if (frequency === "monthly") {
      next.setMonth(now.getMonth() + 1)
      next.setDate(1)
      next.setHours(0, 0, 0, 0)
    }

    return next
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const target = getNextResetDate()
      const diff = target.getTime() - now.getTime()

      const ready = diff <= 0

      setIsReady(ready)

      // 🔥 trigger callback ONLY when state changes
      if (lastState.current !== ready) {
        lastState.current = ready
        onReadyChange?.(ready)
      }

      if (ready) {
        setTimeLeft("Disponible")
        return
      }

      const seconds = Math.floor(diff / 1000) % 60
      const minutes = Math.floor(diff / (1000 * 60)) % 60
      const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const weeks = Math.floor(days / 7)
      const months = Math.floor(days / 30)

      let display = ""

      if (months > 0) display += `${months}m `
      if (weeks > 0) display += `${weeks}w `
      if (days > 0) display += `${days % 7}j `
      if (hours > 0) display += `${hours}h `
      display += `${minutes}m ${seconds}s`

      setTimeLeft(display)
    }, 1000)

    return () => clearInterval(interval)
  }, [frequency, onReadyChange])

  return (
    <div
      className={`relative rounded-xl p-4 border text-center transition-all
      ${isReady
          ? "bg-green-50 border-green-200 text-green-600 dark:bg-green-950 dark:border-green-900"
          : "bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-950 dark:border-pink-900"
        }`}
    >
      {!isReady && (
        <div className="absolute inset-0 rounded-xl animate-pulse opacity-20 bg-pink-400" />
      )}

      <p className="text-xs uppercase tracking-wide opacity-70">
        {isReady ? "Paiement disponible" : "Prochain paiement dans"}
      </p>

      <p className="text-2xl font-semibold tracking-tight">
        {timeLeft}
      </p>
    </div>
  )
}
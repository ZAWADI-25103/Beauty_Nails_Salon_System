"use client"

import { Appointment } from "@/lib/api/appointments"
import { useEffect, useState } from "react"

export default function AppointmentCountdown({
  date,
  time,
  appointment,
  onMissedAutoCancel,
}: {
  date: string | Date
  time: string
  appointment: Appointment
  onMissedAutoCancel?: (appointment: any) => void
}) {
  const [display, setDisplay] = useState("")
  const [missed, setMissed] = useState(false)
  const [triggered, setTriggered] = useState(false)
  const [grace, setGrace] = useState("")

  useEffect(() => {
    const appointmentDate = new Date(date)
    const [h, m] = time.split(":").map(Number)
    appointmentDate.setHours(h)
    appointmentDate.setMinutes(m)
    appointmentDate.setSeconds(0)

    const interval = setInterval(() => {
      const now = new Date()

      const diff = appointmentDate.getTime() - now.getTime()

      const abs = Math.abs(diff)
      const days = Math.floor(abs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((abs / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((abs / (1000 * 60)) % 60)
      if (diff > 0) {
        // BEFORE appointment
        setMissed(false)

        if (days > 0) setDisplay(`${days}j ${hours}h ${minutes}m`)
        else if (hours > 0) setDisplay(`${hours}h ${minutes}m`)
        else setDisplay(`${minutes}m`)
      } else {
        // AFTER appointment
        setMissed(true)

        const missedDuration = now.getTime() - appointmentDate.getTime()

        const TWENTY_FIVE_MIN = 25 * 60 * 1000
        const remaining = TWENTY_FIVE_MIN - missedDuration

        // ⛔ Auto cancel
        if (remaining <= 0 && !triggered) {
          setTriggered(true)
          onMissedAutoCancel?.(appointment)
        }

        // ⏱️ Missed since
        const missedMin = Math.floor((missedDuration / (1000 * 60)) % 60)
        const missedSec = Math.floor((missedDuration / 1000) % 60)

        // ⏳ Remaining grace
        const remMin = Math.max(0, Math.floor((remaining / (1000 * 60)) % 60))
        const remSec = Math.max(0, Math.floor((remaining / 1000) % 60))

        if (remaining > 0) {
          setDisplay(`+${missedMin}m ${missedSec}s`)
          setGrace(`${remMin}m ${remSec}s`)
        } else {
          setDisplay(`${days}j ${hours}h`)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [date, time, triggered])

  return (
    <div
      className={`rounded-xl p-4 text-center border 
      ${missed
          ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950 dark:border-red-900"
          : "bg-pink-50 border-pink-200 text-purple-600 dark:bg-purple-950 dark:border-purple-900"
        }`}
    >
      <p className="text-base uppercase tracking-wide opacity-70">
        {missed ? "Manqué depuis" : "Temps restant"}
      </p>

      <p className="text-3xl font-semibold tracking-tight">
        {display}
      </p>
      {missed && !triggered && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-300">
            ⏳ Vous êtes attendu au {appointment.location || "salon"}
          </p>
          <p className="text-amber-600 dark:text-amber-400">
            avec {appointment.worker?.user?.name}
          </p>
          <p className="mt-1 text-xs opacity-80">
            Annulation automatique dans {grace} min
          </p>
        </div>
      )}
    </div>
  )
}
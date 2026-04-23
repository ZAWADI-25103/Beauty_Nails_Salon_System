"use client"

import { useState } from "react"
import { Search, QrCode } from "lucide-react"
import { usePayments } from "@/lib/hooks/usePayments"
import { useAppointments } from "@/lib/hooks/useAppointments"
import { useServices } from "@/lib/hooks/useServices"
import { useWorkerProfiles } from "@/lib/hooks/useWorkerProfile"
import { QRScanner } from "./QRScanner"
import { useAuth } from "@/lib/hooks/useAuth"
import { AppointmentResults } from "./AppointmentResults"
import { PaymentResults } from "./PaymentResults"
import { UserResults } from "./UserResults"
import { ServiceResults } from "./ServiceResults"
import { WorkerResults } from "./WorkerResults"
import { useClients } from "@/lib/hooks/useClients"
import { useUsers } from "@/lib/hooks/useSettings"
import { ClientResults } from "./ClientResults"
import { Appointment } from "@/lib/api/appointments"

export default function FloatingSearch() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-pink-600 text-white p-4 rounded-full shadow-xl hover:bg-pink-700"
      >
        <Search size={20} />
      </button>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  )
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()

  const isAdmin = user?.role === "admin"
  const isWorker = user?.role === "worker"
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("appointments")
  const [scannerOpen, setScannerOpen] = useState(false)

  const filters = isAdmin
    ? ["appointments", "payments", "services", "workers", "clients"]
    : isWorker
      ? ["appointments", "payments"]
      : ["appointments", "services"]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="hover:shadow-lg border border-pink-100 hover:border-pink-400  dark:border-pink-900 dark:hover:border-pink-400 bg-white dark:bg-gray-950 p-6 rounded-xl w-150 shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Search & Scan</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm ${filter === f
                ? "bg-pink-600 text-white"
                : "bg-gray-200 dark:bg-zinc-800"
                }`}
            >
              {f === "appointments" ? "Rendez-vous et paiements" :
                f === "payments" ? "Paiements" :
                  f === "services" ? "Services" : "Inconnu"}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter transaction ID or search appointments, services, workers"
            className="flex-1 p-2 border rounded-lg"
          />

          {/* QR Button */}
          <button
            onClick={() => setScannerOpen(true)}
            className="p-2 bg-gray-200 rounded-lg"
          >
            <QrCode size={18} className="text-gray-700" />
          </button>
        </div>

        {/* Results */}
        <SearchResults query={query} filter={filter} />

        {/* QR Scanner */}
        {scannerOpen && (
          <QRScanner
            onClose={() => setScannerOpen(false)}
            onScan={(value) => {
              setQuery(value)
              setScannerOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}


function SearchResults({ query, filter }: any) {
  const { payments } = usePayments()

  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const isWorker = user?.role === "worker"

  let appointments = []
  if (!isAdmin && !isWorker) {
    // Get appointments
    const {
      appointments: apps = [],
    } = useAppointments({
      clientId: user?.clientProfile?.id,
    });
    appointments = apps
  } else {
    const { appointments: apps = [] } = useAppointments()
    appointments = apps
  }

  const { services } = useServices()
  const { workers } = useWorkerProfiles()
  const { clients } = useClients()
  const { data: users } = useUsers()

  if (!query) return null

  // 🔎 FILTERING LOGIC
  const filtered = {
    appointments: appointments?.filter((a: Appointment) =>
    (a.paymentIntent?.transactionId?.includes(query) || a.id.includes(query) || a.service?.name.toLowerCase().includes(query.toLowerCase()) || a.worker?.user?.name.toLowerCase().includes(query.toLowerCase()) || a.client?.user?.name.toLowerCase().includes(query.toLowerCase()))
    ),
    payments: payments?.filter((p: any) =>
      p.transactionId?.includes(query)
    ),
    users: users?.filter((u: any) =>
      u.name.toLowerCase().includes(query.toLowerCase())
    ),
    services: services?.filter((s: any) =>
      s.name.toLowerCase().includes(query.toLowerCase())
    ),
    workers: workers?.filter((w: any) =>
      w.user?.name.toLowerCase().includes(query.toLowerCase())
    ),
    clients: clients?.filter((w: any) =>
      w.user?.name.toLowerCase().includes(query.toLowerCase())
    ),
  }

  // 🎨 RENDER
  switch (filter) {
    case "appointments":
      return <AppointmentResults data={filtered.appointments} />

    case "payments":
      return <PaymentResults data={filtered.payments} />

    case "users":
      return <UserResults data={filtered.users} />

    case "services":
      return <ServiceResults data={filtered.services} />

    case "clients":
      return <ClientResults data={filtered.clients} />

    case "workers":
      return <WorkerResults data={filtered.workers} />

    default:
      return null
  }
}
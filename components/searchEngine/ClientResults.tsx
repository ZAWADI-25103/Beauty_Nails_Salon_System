export function ClientResults({ data }: any) {
  if (!data?.length) {
    return <p className="text-sm text-gray-500 mt-4">Aucun client trouvé</p>
  }

  return (
    <div className="mt-4 space-y-4 max-h-[450px] overflow-y-auto">
      {data.map((client: any) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  )
}

import { User, Star, Gift, Wallet } from "lucide-react"

function ClientCard({ client }: any) {

  return (
    <div className="p-5 border border-pink-100 dark:border-pink-900 rounded-2xl shadow-md bg-white dark:bg-gray-950 hover:shadow-lg transition">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
            <User className="w-5 h-5 text-pink-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold">
              {client.user?.name}
            </h3>
            <p className="text-sm text-gray-500">
              {client.user?.email}
            </p>
          </div>
        </div>

        {/* Tier Badge */}
        <span className={`px-3 py-1 rounded-full text-xs  ${client.tier === "Regular" ? "bg-gray-100 text-gray-700" : client.tier === "VIP" ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"}`}>
          {client.tier}
        </span>
      </div>

      {/* BASIC INFO */}
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <span>📞 {client.user?.phone}</span>
        <span>🎂 {client.birthday || "N/A"}</span>
        <span>📍 {client.address || "N/A"}</span>
        <span>👥 Referrals: {client.referrals || 0}</span>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <StatBox icon={<Star />} label="Points" value={client.loyaltyPoints} />
        <StatBox icon={<Wallet />} label="Spent" value={`${client.totalSpent} CDF`} />
        <StatBox icon={<Gift />} label="Free" value={client.freeServiceCount} />
      </div>

      {/* BALANCES */}
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          💰 Prépayé: {client.prepaymentBalance || 0} CDF
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          🎁 GiftCard: {client.giftCardBalance || 0} CDF
        </div>
      </div>

      {/* FAVORITES */}
      {client.favoriteServices?.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">💅 Services favoris</p>
          <div className="flex flex-wrap gap-2">
            {client.favoriteServices.map((s: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ALLERGIES */}
      {client.allergies?.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium mb-1">⚠️ Allergies</p>
          <div className="flex flex-wrap gap-2">
            {client.allergies.map((a: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* NOTES */}
      {client.notes && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-gray-700">
          📝 {client.notes}
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
        <span>Créé: {new Date(client.createdAt).toLocaleDateString()}</span>
        <span>
          {client.user?.isActive ? "🟢 Actif" : "🔴 Inactif"}
        </span>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value }: any) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 flex flex-col items-center text-center">
      <div className="text-pink-500 mb-1">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
import { Card } from "../ui/card"

export function WorkerResults({ data }: any) {
  if (!data?.length) {
    return <p className="text-sm text-gray-500 mt-4">Aucun employé trouvé</p>
  }

  return (
    <Card className="mt-4 p-6 border border-pink-100 dark:border-pink-900 bg-white dark:bg-gray-950">
      <h3 className="text-xl font-semibold mb-4">Employés</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">Nom</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Téléphone</th>
              <th className="text-left py-3 px-4">Spécialité</th>
              <th className="text-left py-3 px-4">Statut</th>
            </tr>
          </thead>

          <tbody>
            {data.map((worker: any) => (
              <tr
                key={worker.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="py-3 px-4 font-medium">
                  {worker.user?.name}
                </td>

                <td className="py-3 px-4">
                  {worker.user?.email}
                </td>

                <td className="py-3 px-4">
                  {worker.user?.phone || "N/A"}
                </td>

                <td className="py-3 px-4">
                  {worker.speciality || "N/A"}
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${worker.user?.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30"
                      }`}
                  >
                    {worker.user?.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
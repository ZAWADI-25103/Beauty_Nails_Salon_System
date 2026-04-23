import { Card } from "../ui/card";

export function PaymentResults({ data }: any) {
  return (
    <Card className="mt-4 p-4 border border-pink-100 dark:border-pink-900 bg-white dark:bg-gray-950">
      <h3 className="text-lg font-semibold mb-4">Paiements</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Transaction</th>
              <th className="text-left p-2">Montant</th>
              <th className="text-left p-2">Téléphone</th>
              <th className="text-left p-2">Statut</th>
            </tr>
          </thead>

          <tbody>
            {data?.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{p.transactionId}</td>
                <td className="p-2">{p.amount} CDF</td>
                <td className="p-2">{p.method}</td>
                <td className="p-2">
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                    {p.status}
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
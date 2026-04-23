import { Card } from "../ui/card";

export function UserResults({ data }: any) {
  return (
    <Card className="mt-4 p-6 border border-pink-100 dark:border-pink-900 bg-white dark:bg-gray-950">
      <h3 className="text-xl font-semibold mb-4">Utilisateurs</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
            </tr>
          </thead>

          <tbody>
            {data?.map((user: any) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
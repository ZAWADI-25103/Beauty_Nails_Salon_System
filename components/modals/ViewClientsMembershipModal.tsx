import { useMembershipPurchases } from "@/lib/hooks/useMemberships";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Membership, MembershipPurchase } from "@/lib/api/memberships";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface ViewClientsModalProps {
  membership: Membership | null;
  onClose: () => void;
}

export default function ViewClientsMembershipModal({ membership, onClose }: ViewClientsModalProps) {
  const { purchases, isLoading } = useMembershipPurchases({ membershipId: membership?.id }); // Hypothetical filter by membershipId

  if (!membership) return null;

  return (
    <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Clients avec l'Abonnement: {membership.name}</DialogTitle>
      </DialogHeader>
      {isLoading ? (
        <div>Chargement des clients...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Date d'Achat</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date Fin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase: MembershipPurchase) => {
              const client = purchase.client; // Assume client data is fetched with purchase
              return (
                <TableRow key={purchase.id}>
                  <TableCell>{client?.user?.name || client?.user?.email || "Client Inconnu"}</TableCell>
                  <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={purchase.status === 'active' ? "default" : purchase.status === 'expired' ? "destructive" : "secondary"}>
                      {purchase.status === 'active' ? 'Actif' : purchase.status === 'expired' ? 'Expiré' : 'Annulé'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(purchase.endDate).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">Aucun client trouvé pour cet abonnement.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
      </DialogFooter>
    </DialogContent>
  );
}
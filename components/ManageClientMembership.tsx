// --- NEW COMPONENT: ManageClientMembership ---

import { useMembershipPurchases, useMemberships } from "@/lib/hooks/useMemberships";
import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ManageClientMembershipProps {
  clientId: string;
}

export default function ManageClientMembership({ clientId }: ManageClientMembershipProps) {
  const { purchases, isLoading, error, purchaseMembership, updatePurchase } = useMembershipPurchases({ clientId });
  const { memberships } = useMemberships(); // Fetch available memberships to choose from

  const [selectedMembershipId, setSelectedMembershipId] = useState<string>("");
  const [autoRenew, setAutoRenew] = useState<boolean>(true); // Default auto-renew on

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  const activePurchase = purchases.find(p => p.status === 'active'); // Assume only one active at a time

  const handlePurchase = () => {
    if (selectedMembershipId) {
      purchaseMembership({ clientId, membershipId: selectedMembershipId, autoRenew });
    }
  };

  const handleCancel = (purchaseId: string) => {
    // Assuming cancellation means setting status to 'cancelled'
    updatePurchase({ id: purchaseId, data: { status: 'cancelled' } });
  };

  const handleRenew = (purchaseId: string, membershipId: string) => {
    // Renewal logic: could mean extending end date or creating a new purchase record.
    // For simplicity, here we just update the status to active again if it was cancelled/expired.
    // A full renewal might require payment processing logic.
    updatePurchase({ id: purchaseId, data: { status: 'active' } });
  };

  const handleUpgrade = (currentPurchaseId: string, newMembershipId: string) => {
    // Upgrading could involve cancelling the old one and purchasing a new one.
    // Simplified here by just updating the membershipId and resetting dates.
    // Real logic depends on business rules (proration, payment, etc.).
    updatePurchase({ id: currentPurchaseId, data: { membershipId: newMembershipId, status: 'active' /*, reset start/end dates */ } });
  };

  return (
    <div className="space-y-4">
      {!activePurchase && (
        <div className="rounded-2xl border border-purple-200/30 dark:border-purple-800/30 p-6 bg-white dark:bg-gray-900 shadow-lg space-y-5">

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aucun abonnement actif
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              Sélectionnez un abonnement premium pour ce client.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            <div className="space-y-2">
              <Select value={selectedMembershipId} onValueChange={setSelectedMembershipId} >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un abonnement" />
                </SelectTrigger>

                <SelectContent className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-lg">
                  {memberships
                    .filter(m => m.isActive)
                    .map(m => (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                      >
                        {m?.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* <select
              value={selectedMembershipId}
              onChange={(e) => setSelectedMembershipId(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-lg"
            >
              <option value="">Choisir un abonnement</option>
              {memberships
                .filter(m => m.isActive)
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.price} CDF
                  </option>
                ))}
            </select> */}

            <Button
              onClick={handlePurchase}
              disabled={!selectedMembershipId}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-5"
            >
              Acheter maintenant
            </Button>

          </div>

          <div className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400">
            <input
              id="autoRenew"
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="autoRenew">Activer le renouvellement automatique</label>
          </div>

        </div>
      )}
      {activePurchase && (
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white shadow-2xl transition-all duration-300 hover:scale-[1.02]">

          {/* Glow effect */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl"></div>

          <div className="relative z-10 space-y-5">

            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold tracking-wide">
                  {activePurchase.membership?.name || "Abonnement"}
                </h3>
                <p className="text-lg text-purple-100 mt-1">
                  {new Date(activePurchase.startDate).toLocaleDateString()} →
                  {" "}
                  {new Date(activePurchase.endDate).toLocaleDateString()}
                </p>
              </div>

              <Badge
                className={`px-3 py-1 text-base font-medium rounded-full ${activePurchase.status === "active"
                  ? "bg-green-500/20 text-green-200 border border-green-300/30"
                  : activePurchase.status === "expired"
                    ? "bg-yellow-500/20 text-yellow-200 border border-yellow-300/30"
                    : "bg-red-500/20 text-red-200 border border-red-300/30"
                  }`}
              >
                {activePurchase.status === "active"
                  ? "ACTIVE"
                  : activePurchase.status === "expired"
                    ? "EXPIRED"
                    : "CANCELLED"}
              </Badge>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/20"></div>

            {/* Auto Renew */}
            <div className="flex justify-between text-lg">
              <span className="text-purple-200">Auto-renouvellement</span>
              <span className="font-medium">
                {activePurchase.autoRenew ? "Activé" : "Désactivé"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleRenew(activePurchase.id, activePurchase.membershipId)}
                disabled={activePurchase.status === "active"}
                className="bg-white/20 hover:bg-white/30 text-white border-none"
              >
                Renouveler
              </Button>

              <Button
                size="sm"
                onClick={() => handleCancel(activePurchase.id)}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-400/30"
              >
                Annuler
              </Button>

              <div className="space-y-2">
                <Select value={selectedMembershipId} onValueChange={setSelectedMembershipId} >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un abonnement" className="text-gray-400" />
                  </SelectTrigger>

                  <SelectContent className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-lg">
                    {memberships
                      .filter(m => m.isActive)
                      .map(m => (
                        <SelectItem
                          key={m.id}
                          value={m.id}
                        >
                          {m?.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

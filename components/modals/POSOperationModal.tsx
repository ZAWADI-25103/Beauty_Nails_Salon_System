"use client"
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { usePayments } from "@/lib/hooks/usePayments";
import { toast } from "sonner";

export default function POSOperationModal({ triggerLabel = "Opération POS" }: { triggerLabel?: string }) {
  const [appointmentId, setAppointmentId] = useState("");
  const [clientId, setClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'mixed'>('card');
  const [discountCode, setDiscountCode] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | ''>('');
  const [tip, setTip] = useState<number | ''>('');
  const [itemServiceId, setItemServiceId] = useState("");
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState<number | ''>(1);
  const [items, setItems] = useState<Array<{ serviceId: string; quantity: number; price: number }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { processPayment, isProcessing } = usePayments();

  const addItem = () => {
    if (!itemServiceId || itemPrice === '') {
      toast.error('Veuillez renseigner l\'ID du service et le prix');
      return;
    }
    setItems([...items, {
      serviceId: itemServiceId,
      quantity: Number(itemQuantity || 1),
      price: Number(itemPrice)
    }]);
    setItemServiceId('');
    setItemPrice('');
    setItemQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onSubmit = () => {
    if (items.length === 0) {
      toast.error('Ajouter au moins un article au paiement');
      return;
    }
    const payload: any = {
      appointmentId: appointmentId || undefined,
      clientId: clientId || undefined,
      items: items.map(i => ({
        serviceId: i.serviceId,
        quantity: i.quantity,
        price: i.price
      })),
      paymentMethod,
      discountCode: discountCode || undefined,
      loyaltyPointsUsed: loyaltyPoints === '' ? undefined : Number(loyaltyPoints),
      tip: tip === '' ? undefined : Number(tip),
    };

    processPayment(payload);

    setIsOpen(false);
    setAppointmentId('');
    setClientId('');
    setPaymentMethod('card');
    setDiscountCode('');
    setLoyaltyPoints('');
    setTip('');
    setItems([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full sm:w-auto">
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
            Effectuer un paiement (POS)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          {/* Client Information - Mobile Optimized */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor="pos-appointment" className="text-lg">ID Rendez-vous (optionnel)</Label>
              <Input
                id="pos-appointment"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                className="h-11 text-base"
              />
            </div>
            <div>
              <Label htmlFor="pos-client" className="text-lg">Client ID (optionnel)</Label>
              <Input
                id="pos-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </div>

          {/* Item Entry - Mobile Optimized */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor="pos-item-service" className="text-lg">ID Service/Produit</Label>
              <Input
                id="pos-item-service"
                value={itemServiceId}
                onChange={(e) => setItemServiceId(e.target.value)}
                placeholder="ex: svc_123"
                className="h-11 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pos-item-price" className="text-lg">Prix</Label>
                <Input
                  id="pos-item-price"
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-11 text-base"
                />
              </div>
              <div>
                <Label htmlFor="pos-item-qty" className="text-lg">Quantité</Label>
                <Input
                  id="pos-item-qty"
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-11 text-base"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="default" className="w-full sm:w-auto" onClick={addItem}>
              Ajouter article
            </Button>
            <span className="text-lg text-gray-500 self-center">
              {items.length} article(s) ajoutés
            </span>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-base">{it.serviceId}</p>
                    <p className="text-lg text-gray-600">
                      {it.quantity} × {it.price.toLocaleString()} CDF
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(idx)}
                    className="h-9 w-9"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Payment Details - Mobile Optimized */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor="pos-method" className="text-lg">Méthode</Label>
              <select
                id="pos-method"
                className="w-full rounded-md border px-3 py-2.5 text-base"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="card">Carte</option>
                <option value="cash">Espèces</option>
                <option value="mobile">Mobile</option>
                <option value="mixed">Mixte</option>
              </select>
            </div>

            <div>
              <Label htmlFor="pos-discount" className="text-lg">Code promo (optionnel)</Label>
              <Input
                id="pos-discount"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="h-11 text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pos-loyalty" className="text-lg">Points fidélité (optionnel)</Label>
                <Input
                  id="pos-loyalty"
                  type="number"
                  value={loyaltyPoints}
                  onChange={(e) => setLoyaltyPoints(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-11 text-base"
                />
              </div>
              <div>
                <Label htmlFor="pos-tip" className="text-lg">Pourboire (optionnel)</Label>
                <Input
                  id="pos-tip"
                  type="number"
                  value={tip}
                  onChange={(e) => setTip(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-11 text-base"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={onSubmit}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? "Traitement..." : "Payer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
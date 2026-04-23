import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Image as ImageIcon, Barcode, Scan } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useInventory } from '@/lib/hooks/useInventory';

// --- Add Product Modal ---
interface AddProductModalProps {
  trigger?: React.ReactNode;
}

export function AddProductModal({ trigger }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [cost, setCost] = useState<number | ''>('');
  const [supplier, setSupplier] = useState("");
  const [initialStock, setInitialStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>('');
  const [maxStock, setMaxStock] = useState<number | ''>('');
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { createItem, isCreatingItem } = useInventory();

  const onSubmit = async () => {
    if (!name || !category || !unit || cost === '') {
      toast.error("Veuillez remplir le nom, la catégorie, l'unité et le coût");
      return;
    }

    const payload = {
      name,
      sku: sku || undefined,
      category,
      unit,
      cost: Number(cost),
      supplier: supplier || undefined,
      currentStock: initialStock === '' ? undefined : Number(initialStock),
      minStock: minStock === '' ? undefined : Number(minStock),
      maxStock: maxStock === '' ? undefined : Number(maxStock),
      description: description || undefined,
    };

    createItem(payload);

    // Reset form
    setName("");
    setSku("");
    setCategory("");
    setUnit("");
    setCost('');
    setSupplier('');
    setInitialStock('');
    setMinStock('');
    setMaxStock('');
    setDescription('');

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
            Ajouter un Nouveau Produit
          </DialogTitle>
        </DialogHeader>

        <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p>
        <Tabs defaultValue="details" className="w-full py-2">
          <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
            <TabsTrigger value="details" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Détails Produit</TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Stock & Fournisseur</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            {/* Image Upload - Mobile Optimized */}
            <div className="flex justify-center mb-4">
              <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-pink-300 transition-colors">
                <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                <span className="text-lg sm:text-base text-gray-500 mt-2">Ajouter Photo</span>
              </div>
            </div>

            {/* Mobile-First Form Layout */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-lg sm:text-base">Nom du produit</Label>
                <Input
                  placeholder="Ex: Vernis Gel OPI Rouge"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg sm:text-base">Code-barres (SKU)</Label>
                <div className="relative">
                  <Input
                    placeholder="SCAN-12345"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                  <Barcode className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-lg sm:text-base">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onglerie">Onglerie</SelectItem>
                    <SelectItem value="cils">Cils</SelectItem>
                    <SelectItem value="cheveux">Cheveux</SelectItem>
                    <SelectItem value="maquillage">Maquillage</SelectItem>
                    <SelectItem value="retail">Vente Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-lg sm:text-base">Unité</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unité">Unité</SelectItem>
                    <SelectItem value="gramme">Gramme (g)</SelectItem>
                    <SelectItem value="millilitre">Millilitre (ml)</SelectItem>
                    <SelectItem value="boîte">Boîte</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg sm:text-base">Coût d'achat</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="15000"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="pl-10 h-12 text-base"
                />
                <span className="absolute left-3 top-3.5 text-lg text-gray-500">CDF</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg sm:text-base">Description</Label>
              <Textarea
                placeholder="Détails, usage, contenance..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-24 resize-none text-base"
              />
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 pt-4">
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-lg text-orange-800">
                Définissez le seuil d'alerte pour recevoir des notifications automatiques lorsque le stock est bas.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-lg sm:text-base">Stock Initial</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg sm:text-base">Seuil d'alerte (Min)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border-orange-200 focus-visible:ring-orange-500 h-12 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-lg sm:text-base">Stock Maximum</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={maxStock}
                  onChange={(e) => setMaxStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg sm:text-base">Fournisseur</Label>
                <Input
                  placeholder="Ex: Beauty Supplies DRC"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setIsOpen(false)}
            disabled={isCreatingItem}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            onClick={onSubmit}
            disabled={isCreatingItem}
          >
            {isCreatingItem ? "Création..." : "Enregistrer Produit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Adjust Stock Modal ---
interface AdjustStockModalProps {
  productName?: string;
  currentStock?: number;
  trigger?: React.ReactNode;
}

export function AdjustStockModal({ productName, currentStock, trigger }: AdjustStockModalProps) {
  const [reason, setReason] = useState('restock');
  const [qty, setQty] = useState<number | ''>('');
  const { updateStock, isUpdating } = useInventory();

  const handleSubmit = () => {
    if (qty === '' || qty === 0) {
      toast.error('Veuillez entrer une quantité valide');
      return;
    }

    const operation = ['damage', 'usage', 'correction_neg'].includes(reason) ? 'remove' : 'add';
    const quantity = Math.abs(Number(qty));

    // Assuming you have an itemId prop or context to get the current item ID
    // For this example, I'll assume it's passed as a prop or available in context
    // In a real implementation, you would get this from props or context
    const itemId = 'some-item-id';

    updateStock({
      id: itemId,
      stockData: {
        quantity,
        operation,
        notes: `Ajustement: ${reason}`
      }
    });
  };

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
            Ajustement de Stock
          </DialogTitle>
          <p className="text-lg text-gray-500 mt-1">
            {productName || 'Produit'} • Stock actuel: {currentStock || 0}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-lg sm:text-base">Type d'ajustement</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">➕ Réception de marchandise</SelectItem>
                <SelectItem value="return">➕ Retour client</SelectItem>
                <SelectItem value="correction_pos">➕ Correction inventaire (+)</SelectItem>
                <SelectItem value="damage">➖ Perte / Dommage / Vol</SelectItem>
                <SelectItem value="usage">➖ Utilisation Salon</SelectItem>
                <SelectItem value="correction_neg">➖ Correction inventaire (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-lg sm:text-base">
              Quantité à {['damage', 'usage', 'correction_neg'].includes(reason) ? 'retirer' : 'ajouter'}
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="Ex: 5"
              value={qty}
              onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
              className={`h-12 text-base ${['damage', 'usage', 'correction_neg'].includes(reason)
                ? "border-red-300 focus-visible:ring-red-500"
                : "border-green-300 focus-visible:ring-green-500"}`}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-lg sm:text-base">Note / Référence</Label>
            <Textarea
              placeholder="Numéro de BL ou explication..."
              className="h-24 resize-none text-base"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isUpdating}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className={`w-full sm:w-auto ${['damage', 'usage', 'correction_neg'].includes(reason)
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"}`}
            onClick={handleSubmit}
            disabled={isUpdating || qty === ''}
          >
            {isUpdating ? "Traitement..." : `Confirmer ${['damage', 'usage', 'correction_neg'].includes(reason) ? 'Retrait' : 'Ajout'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Order Modal ---
interface OrderModalProps {
  productName?: string;
  supplierName?: string;
  trigger?: React.ReactNode;
}

export function OrderModal({ productName, supplierName, trigger }: OrderModalProps) {
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [unitPrice, setUnitPrice] = useState<number | ''>(15000);
  const { createReorder, isCreatingReorder } = useInventory();

  const handleSubmit = () => {
    if (quantity === '' || quantity <= 0 || unitPrice === '' || unitPrice <= 0) {
      toast.error('Veuillez entrer des valeurs valides');
      return;
    }

    // Assuming you have an itemId prop or context to get the current item ID
    // For this example, I'll assume it's passed as a prop or available in context
    const itemId = 'some-item-id';
    const supplierId = 'some-supplier-id';

    createReorder({
      itemId,
      supplierId,
      quantity: Number(quantity)
    });
  };

  const total = quantity && unitPrice ? Number(quantity) * Number(unitPrice) : 0;

  return (
    <Dialog>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
            Nouvelle Commande Fournisseur
          </DialogTitle>
          <p className="text-lg text-gray-500 mt-1">
            {supplierName || 'Fournisseur'} • Fournisseur Principal
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-lg sm:text-base">Produit à commander</Label>
            <Input
              defaultValue={productName}
              placeholder="Nom du produit"
              className="h-12 text-base"
              readOnly
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-lg sm:text-base">Quantité</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-lg sm:text-base">Prix Unitaire Est.</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="pr-10 h-12 text-base"
                />
                <span className="absolute right-3 top-3 text-base sm:text-lg text-gray-500">CDF</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-900 text-white p-3 rounded-lg">
            <span className="text-lg sm:text-base">Total Estimé</span>
            <span className="text-lg sm:text-xl font-bold">{total.toLocaleString()} CDF</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button variant="outline" className="w-full sm:w-auto" disabled={isCreatingReorder}>
            Brouillon
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
            onClick={handleSubmit}
            disabled={isCreatingReorder}
          >
            {isCreatingReorder ? "Envoi..." : "Envoyer Commande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
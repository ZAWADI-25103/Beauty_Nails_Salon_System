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
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useInventory } from "@/lib/hooks/useInventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PackagePlus, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";

export default function CreateInventoryModal({ triggerLabel = "Créer un article" }: { triggerLabel?: string }) {
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
  const [imageUrl, setImageUrl] = useState(""); // New state
  const [isOpen, setIsOpen] = useState(false);

  const { createItem, isCreatingItem } = useInventory();

  const onSubmit = async () => {
    if (!name || !category || !unit || cost === '') { 
      toast.error("Champs obligatoires manquants"); 
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
      imageUrl: imageUrl || undefined, // Added to payload
    };

    createItem(payload as any);

    // Reset Form
    setIsOpen(false);
    setName(""); setSku(""); setCategory(""); setUnit("");
    setCost(''); setSupplier(''); setInitialStock('');
    setMinStock(''); setMaxStock(''); setDescription('');
    setImageUrl('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-black hover:bg-gray-800 dark:bg-white dark:text-black transition-all shadow-lg flex gap-2">
          <PackagePlus className="w-4 h-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto border-0 shadow-2xl rounded-[2rem] dark:bg-gray-950 p-0 overflow-hidden">
        {/* Header Decor */}
        <div className="bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 p-8 text-white dark:text-black">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 dark:bg-black/10 rounded-xl backdrop-blur-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Nouvel Article Premium</DialogTitle>
            </div>
            <p className="opacity-70 text-sm mt-1">Configurez les détails de votre produit avec précision.</p>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          {/* Section: Visuel & Identité */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Image Preview Box */}
            <div className="space-y-4">
               <Label className="text-xs uppercase font-black tracking-widest text-gray-400">Aperçu Visuel</Label>
               <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black/40 group relative">
                 {imageUrl ? (
                   <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center p-4">
                     <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                     <p className="text-[10px] text-gray-400">Aucune image</p>
                   </div>
                 )}
               </div>
               <Input 
                placeholder="URL de l'image (https://...)" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-gray-50 dark:bg-white/5 border-0 rounded-xl"
               />
            </div>

            {/* Core Info */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Nom du produit</Label>
                <Input placeholder="ex: Vernis Semi-Permanent" className="h-12 text-lg font-medium rounded-xl focus:ring-2 ring-gray-900" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Catégorie</Label>
                <Select value={category} onValueChange={(value) => setCategory(value)}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-100 dark:border-gray-800">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-0">
                    <SelectItem value="onglerie">💅 Onglerie</SelectItem>
                    <SelectItem value="cils">👁️ Cils</SelectItem>
                    <SelectItem value="tresses">💇‍♀️ Tresses</SelectItem>
                    <SelectItem value="maquillage">💄 Maquillage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">SKU</Label>
                <Input className="h-12 rounded-xl" placeholder="REF-000" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-900" />

          {/* Section: Finance & Logistique */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Coût (CDF)</Label>
              <Input type="number" className="h-12 rounded-xl font-mono text-lg bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900" value={cost} onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>

            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Unité</Label>
              <Input className="h-12 rounded-xl" placeholder="ex: Flacon" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>

            <div className="col-span-2">
              <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Fournisseur</Label>
              <Input className="h-12 rounded-xl" placeholder="Nom du fournisseur" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
          </div>

          {/* Section: Stockage */}
          <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-[2rem] grid grid-cols-3 gap-6">
            <div>
              <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Initial</Label>
              <Input type="number" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-0 shadow-sm" value={initialStock} onChange={(e) => setInitialStock(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Minimum</Label>
              <Input type="number" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-0 shadow-sm" value={minStock} onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Maximum</Label>
              <Input type="number" className="h-12 rounded-xl bg-white dark:bg-gray-900 border-0 shadow-sm" value={maxStock} onChange={(e) => setMaxStock(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase font-black tracking-widest text-gray-400 mb-2 block">Description</Label>
            <Textarea className="rounded-2xl border-gray-100 dark:border-gray-800 focus:ring-gray-900 min-h-25" placeholder="Détails additionnels du produit..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="p-8 bg-gray-50 dark:bg-black/20 flex gap-4">
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl px-8">Annuler</Button>
          </DialogClose>
          <Button 
            onClick={onSubmit} 
            disabled={isCreatingItem}
            className="rounded-xl px-12 bg-black hover:bg-gray-800 dark:bg-white dark:text-black font-bold h-12 shadow-xl"
          >
            {isCreatingItem ? <Loader2 className="animate-spin" /> : "Finaliser l'article"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

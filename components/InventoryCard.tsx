import { Package, ShoppingCart, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InventoryItem } from '@/prisma/generated/client';
import { AdjustStockModal, OrderModal } from './modals/InventoryModals';

// Premium Color Mapping for a cleaner look
const statusStyles = {
  out_of_stock: "border-red-500/30 bg-linear-to-br from-white to-red-50/50 dark:from-gray-900 dark:to-red-950/20 text-red-600",
  critical: "border-orange-500/30 bg-linear-to-br from-white to-orange-50/50 dark:from-gray-900 dark:to-orange-950/20 text-orange-600",
  low: "border-amber-500/30 bg-linear-to-br from-white to-amber-50/50 dark:from-gray-900 dark:to-amber-950/20 text-amber-600",
  good: "border-emerald-500/30 bg-linear-to-br from-white to-emerald-50/50 dark:from-gray-900 dark:to-emerald-950/20 text-emerald-600"
};

const progressColors = {
  out_of_stock: "bg-red-500",
  critical: "bg-orange-500",
  low: "bg-amber-500",
  good: "bg-emerald-500"
};

export const InventoryCard = ({ item }: { item: InventoryItem }) => {
  const style = statusStyles[item.status] || statusStyles.good;
  const progressColor = progressColors[item.status] || progressColors.good;
  const stockPercentage = Math.min((item.currentStock / item.minStock) * 100, 100);

  console.log(item);

  return (
    <Card key={item.id} className={`group relative overflow-hidden border-0 shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-3xl ${style}`}>
      {/* Decorative Gradient Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-current to-transparent opacity-20" />

      <div className="p-5 sm:p-7">
        {/* Header: Image & Category */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 text-gray-500 shadow-inner flex items-center justify-center border border-gray-100 dark:border-gray-700">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <Package className="w-10 h-10 opacity-20" />
              )}
            </div>
            <Badge className="absolute -bottom-2 -right-2 px-3 py-1 bg-white dark:bg-gray-800 text-gray-500 shadow-lg text-[10px] font-bold uppercase tracking-widest border-gray-100 dark:border-gray-700">
              {item.category}
            </Badge>
          </div>
          
          <div className="text-right">
             <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {item.cost.toLocaleString()} <small className="text-xs font-medium opacity-60">CDF</small>
             </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-1">{item.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 italic">{item.description || "Aucune description fournie"}</p>
        </div>

        {/* Inventory Stats Glass Container */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/5">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400">Stock Actuel</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {item.currentStock} <span className="text-xs font-normal opacity-60">{item.unit}</span>
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Utilisation</p>
            <p className={`text-lg font-bold ${stockPercentage < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                {stockPercentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full mb-6 p-0.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.1)] ${progressColor}`}
            style={{ width: `${stockPercentage}%` }}
          />
        </div>

        {/* Meta Info */}
        <div className="space-y-2 mb-8 px-1">
          <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
            <Info className="w-3.5 h-3.5 mr-2 opacity-70" />
            Fournisseur: <span className="text-gray-800 dark:text-gray-200 ml-auto">{item.supplier || "N/A"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {(item.status !== 'good' || item.currentStock <= item.minStock) && (
            <OrderModal
              productName={item.name}
              supplierName={item.supplier!}
              trigger={
                <Button className="flex-1 h-12 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white rounded-xl shadow-xl transition-all active:scale-95">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Réappro
                </Button>
              }
            />
          )}
          <AdjustStockModal
            productName={item.name}
            currentStock={item.currentStock}
            trigger={
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-all">
                Ajuster
              </Button>
            }
          />
        </div>
      </div>
    </Card>
  );
};

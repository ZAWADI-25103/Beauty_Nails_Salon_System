"use client"

import { useState } from 'react';
import { Card } from './ui/card';
import { useServices } from '@/lib/hooks/useServices';
import { useInventory } from '@/lib/hooks/useInventory';
import POSOperationModal from '@/components/modals/POSOperationModal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone, Gift, Percent } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

interface PaymentMethod {
  type: 'cash' | 'card' | 'mobile' | 'giftcard';
  amount: number;
}

export default function POSCheckout({ showMock }: { showMock?: boolean }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');

  const { services: apiServices = [] } = useServices();
  const { inventory: apiInventory = [] } = useInventory();

  const MOCK_SERVICES = [
    { id: 's1', name: 'Manucure Gel', price: 30000, type: 'service' as const },
  ];
  const MOCK_PRODUCTS = [
    { id: 'p1', name: 'Vernis Gel', price: 15000, type: 'product' as const },
  ];

  type ItemSource = { id: string; name: string; price: number; type: 'service' | 'product' };
  const services: ItemSource[] = (apiServices && apiServices.length) ? (apiServices as any as ItemSource[]) : (showMock ? MOCK_SERVICES : []);
  const products: ItemSource[] = (apiInventory && apiInventory.length) ? apiInventory.map((i: any) => ({ id: i.id, name: i.name, price: Number(i.cost || 0), type: 'product' as const })) : (showMock ? MOCK_PRODUCTS : []);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const addToCart = (item: ItemSource) => {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      setCart(cart.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
  const remaining = total - totalPaid;

  const addPayment = (type: PaymentMethod['type']) => {
    if (remaining > 0) {
      setPaymentMethods([...paymentMethods, { type, amount: remaining }]);
    }
  };

  const updatePaymentAmount = (index: number, amount: number) => {
    const newPayments = [...paymentMethods];
    newPayments[index].amount = Math.max(0, amount);
    setPaymentMethods(newPayments);
  };

  const removePayment = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const completeTransaction = () => {
    if (remaining <= 0 && cart.length > 0) {
      // API call would go here
      // await processPayment({ cart, paymentMethods, clientName, total });

      alert('Paiement complété avec succès!');
      // Reset
      setCart([]);
      setClientName('');
      setDiscountPercent(0);
      setPaymentMethods([]);
      setShowPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl  sm:text-3xl font-medium  text-gray-900 dark:text-gray-100">Caisse (POS)</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Badge className="flex-1 sm:flex-none justify-center bg-linear-to-r from-green-500 to-emerald-500 text-white px-4 py-2 border-0 shadow-lg shadow-green-500/20">
            Caisse Ouverte
          </Badge>
          <POSOperationModal triggerLabel="Opération POS" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services & Products Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
            <h3 className="text-lg sm:text-xl  text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-500" />
              Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((service) => (
                <Button
                  key={service.id}
                  onClick={() => addToCart(service)}
                  variant="outline"
                  className="h-auto flex flex-col items-start p-4 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-300 dark:hover:border-pink-500 transition-all group"
                >
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400">{service.name}</p>
                  <p className="text-lg  text-pink-600 dark:text-pink-400">{(service.price).toLocaleString()} CDF</p>
                </Button>
              ))}
            </div>
          </Card>

          {/* Products */}
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
            <h3 className="text-lg sm:text-xl  text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
              Produits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <Button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  variant="outline"
                  className="h-auto flex flex-col items-start p-4 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-500 transition-all group"
                >
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400">{product.name}</p>
                  <p className="text-lg  text-purple-600 dark:text-purple-400">{(product.price).toLocaleString()} CDF</p>
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-6">
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950 lg:sticky lg:top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-xl  text-gray-900 dark:text-gray-100">Panier</h3>
              {cart.length > 0 && (
                <Badge className="bg-pink-500 dark:bg-pink-600 text-white ml-auto border-0">
                  {cart.length}
                </Badge>
              )}
            </div>

            <Input
              placeholder="Nom du client (optionnel)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mb-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100 focus:ring-pink-500"
            />

            <Separator className="my-6 dark:bg-gray-800" />

            {/* Cart Items */}
            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto no-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Panier vide</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-900/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className=" text-gray-900 dark:text-gray-100 mb-1">{item.name}</p>
                        <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                          {item.price.toLocaleString()} CDF × {item.quantity}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white dark:bg-gray-950 p-1 rounded-full border border-gray-100 dark:border-gray-800">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-8 w-8 rounded-full hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:text-pink-600"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-lg  text-gray-900 dark:text-gray-100 w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-8 w-8 rounded-full hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:text-pink-600"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-black text-gray-900 dark:text-gray-100">
                        {(item.price * item.quantity).toLocaleString()} CDF
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Separator className="my-6 dark:bg-gray-800" />

            {/* Discount */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <Percent className="w-5 h-5 text-amber-500" />
                </div>
                <Input
                  type="number"
                  placeholder="Remise %"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3 mb-8 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-lg font-medium text-gray-600 dark:text-gray-400">
                <span>Sous-total:</span>
                <span className="text-gray-900 dark:text-gray-100">{subtotal.toLocaleString()} CDF</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-lg  text-green-600 dark:text-green-400">
                  <span>Remise ({discountPercent}%):</span>
                  <span>- {discountAmount.toLocaleString()} CDF</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-lg  text-gray-900 dark:text-gray-100">Total:</span>
                <span className="text-2xl font-black text-pink-600 dark:text-pink-400">{total.toLocaleString()} CDF</span>
              </div>
            </div>

            <Button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full py-8 text-lg  shadow-lg shadow-pink-500/20 transition-all active:scale-95"
            >
              Procéder au Paiement
            </Button>
          </Card>

          {/* Payment Section */}
          {showPayment && cart.length > 0 && (
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all border border-green-100 dark:border-green-900 shadow-xl rounded-2xl bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <h3 className="text-xl  text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                Mode de Paiement
              </h3>

              {/* Payment Methods */}
              <div className="space-y-3 mb-6">
                {paymentMethods.map((pm, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white dark:bg-gray-950 p-4 rounded-2xl border border-green-100 dark:border-green-900/50 shadow-sm">
                    <Badge className={`${pm.type === 'cash' ? 'bg-green-500 dark:bg-green-600' :
                      pm.type === 'card' ? 'bg-blue-500 dark:bg-blue-600' :
                        pm.type === 'mobile' ? 'bg-purple-500 dark:bg-purple-600' : 'bg-amber-500 dark:bg-amber-600'
                      } text-white border-0 px-3 py-1 `}>
                      {pm.type === 'cash' ? 'Espèces' :
                        pm.type === 'card' ? 'Carte' :
                          pm.type === 'mobile' ? 'Mobile Money' : 'Cadeau'}
                    </Badge>
                    <Input
                      type="number"
                      value={pm.amount}
                      onChange={(e) => updatePaymentAmount(index, Number(e.target.value))}
                      className="rounded-xl border-gray-100 dark:border-gray-800  dark:text-gray-100"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removePayment(index)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-10 w-10 rounded-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Payment Method Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <Button
                  onClick={() => addPayment('cash')}
                  variant="outline"
                  className="rounded-2xl h-16 flex flex-col gap-1 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
                  disabled={remaining <= 0}
                >
                  <Banknote className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px]  uppercase tracking-widest dark:text-gray-300">Espèces</span>
                </Button>
                <Button
                  onClick={() => addPayment('card')}
                  variant="outline"
                  className="rounded-2xl h-16 flex flex-col gap-1 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  disabled={remaining <= 0}
                >
                  <CreditCard className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px]  uppercase tracking-widest dark:text-gray-300">Carte</span>
                </Button>
                <Button
                  onClick={() => addPayment('mobile')}
                  variant="outline"
                  className="rounded-2xl h-16 flex flex-col gap-1 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                  disabled={remaining <= 0}
                >
                  <Smartphone className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px]  uppercase tracking-widest dark:text-gray-300">Mobile</span>
                </Button>
                <Button
                  onClick={() => addPayment('giftcard')}
                  variant="outline"
                  className="rounded-2xl h-16 flex flex-col gap-1 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
                  disabled={remaining <= 0}
                >
                  <Gift className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px]  uppercase tracking-widest dark:text-gray-300">Cadeau</span>
                </Button>
              </div>

              <Separator className="my-6 dark:bg-green-900/30" />

              {/* Payment Summary */}
              <div className="space-y-4 mb-8 bg-white/50 dark:bg-black/10 p-5 rounded-2xl border border-white/50 dark:border-white/5">
                <div className="flex justify-between text-lg font-medium text-gray-600 dark:text-gray-400">
                  <span>Total à payer:</span>
                  <span className="text-gray-900 dark:text-gray-100">{total.toLocaleString()} CDF</span>
                </div>
                <div className="flex justify-between text-lg font-medium text-gray-600 dark:text-gray-400">
                  <span>Total payé:</span>
                  <span className="text-gray-900 dark:text-gray-100">{totalPaid.toLocaleString()} CDF</span>
                </div>
                <Separator className="dark:bg-gray-800" />
                <div className={`flex justify-between items-center ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                  <span className="text-lg  uppercase tracking-wider">{remaining > 0 ? 'Reste à payer:' : 'Monnaie:'}</span>
                  <span className="text-2xl font-black">{Math.abs(remaining).toLocaleString()} CDF</span>
                </div>
              </div>

              <Button
                onClick={completeTransaction}
                disabled={remaining > 0}
                className="w-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full py-8 text-lg  shadow-lg shadow-green-500/20 transition-all active:scale-95"
              >
                Finaliser la Transaction
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-0 p-6 rounded-2xl">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">Transactions Aujourd'hui</p>
          <p className="text-3xl font-black text-gray-900 dark:text-gray-100">32</p>
        </Card>
        <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 p-6 rounded-2xl">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">Revenus Journée</p>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">1 250 000 CDF</p>
        </Card>
        <Card className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-0 p-6 rounded-2xl">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">Ticket Moyen</p>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">39 063 CDF</p>
        </Card>
        <Card className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-0 p-6 rounded-2xl flex items-center">
          <Button className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full py-6  shadow-lg shadow-amber-500/20 transition-all">
            Clôture de Caisse
          </Button>
        </Card>
      </div>
    </div>
  );
}

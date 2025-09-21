import React from 'react';
import { X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartItem from './CartItem';

const CartDrawer = () => {
  const { isCartOpen, closeCart, items, getTotalPrice, clearCart } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-[9998] ${
          isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Carrito"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Carrito</h2>
          <button onClick={closeCart} className="p-2 rounded hover:bg-gray-100" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-64px)]">
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-gray-600">Tu carrito está vacío.</div>
            ) : (
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Vaciar
              </button>
              <a
                href="/checkout"
                className="flex-1 px-4 py-2 rounded bg-blue-600 text-white text-center hover:bg-blue-700"
                onClick={closeCart}
              >
                Finalizar compra
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default CartDrawer;

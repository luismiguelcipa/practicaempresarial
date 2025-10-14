import React, { useState } from 'react';
import { Trash2, Minus, Plus, Copy, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const handleIncrement = () => {
    updateQuantity(item._key, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item._key, item.quantity - 1);
    }
  };

  const handleCopy = () => {
    const textToCopy = `${item.name} - $${item.price.toLocaleString()}`;
    navigator.clipboard.writeText(textToCopy);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };

  const handleTag = () => {
    // Funcionalidad de etiquetar - puedes implementar según necesites
    console.log('Producto etiquetado:', item.name);
  };

  const originalPrice = item.originalPrice || item.price;
  const discount = originalPrice - item.price;
  const hasDiscount = discount > 0;

  return (
    <div className="p-4 relative">
      {showCopyAlert && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full shadow-lg z-10">
          ¡Copiado!
        </div>
      )}
      
      <div className="flex gap-4">
        {/* Imagen del producto */}
        <div className="flex-shrink-0">
          <img
            src={item.image || '/placeholder-product.jpg'}
            alt={item.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        </div>

        {/* Información del producto */}
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1">{item.name}</h3>
          
          {/* Precios */}
          <div className="space-y-1">
            {hasDiscount && (
              <div className="text-sm text-gray-400 line-through">
                ${originalPrice.toLocaleString()}
              </div>
            )}
            <div className="text-lg font-bold text-red-600">
              ${item.price.toLocaleString()}
            </div>
            {hasDiscount && (
              <div className="inline-flex items-center gap-1 text-xs bg-black text-white px-2 py-1 rounded">
                <Tag size={12} />
                <span>edgarimn (-${discount.toLocaleString()})</span>
              </div>
            )}
          </div>

          {/* Controles de cantidad */}
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="inline-flex items-center border-2 border-gray-300 rounded-full overflow-hidden">
              <button
                onClick={handleDecrement}
                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                aria-label="Disminuir cantidad"
              >
                <Minus size={16} />
              </button>
              <div className="px-6 py-2 font-semibold min-w-[60px] text-center border-x-2 border-gray-300">
                {item.quantity}
              </div>
              <button
                onClick={handleIncrement}
                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                aria-label="Aumentar cantidad"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {/* Botón eliminar */}
            <button
              onClick={() => removeFromCart(item._key)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label="Eliminar del carrito"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Botones de acción rápida */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={handleCopy}
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shadow-md"
          aria-label="Copiar información"
          title="Copiar"
        >
          <Copy size={20} className="text-gray-700" />
        </button>
        <button
          onClick={handleTag}
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shadow-md"
          aria-label="Etiquetar producto"
          title="Etiquetar"
        >
          <Tag size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Variantes si existen */}
      {(item.size || item.flavor) && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {item.size && <span className="mr-2">Tamaño: {item.size}</span>}
          {item.flavor && <span>Sabor: {item.flavor}</span>}
        </div>
      )}
    </div>
  );
};

export default CartItem;

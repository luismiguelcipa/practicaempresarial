import React from 'react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0) {
      updateQuantity(item._key, newQuantity);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-md"
        />
        <div>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-gray-600">${item.price}</p>
          {(item.size || item.flavor) && (
            <p className="text-xs text-gray-500 mt-1">
              {item.size && <span className="mr-2">Tamaño: {item.size}</span>}
              {item.flavor && <span>Sabor: {item.flavor}</span>}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={handleQuantityChange}
          className="w-16 px-2 py-1 border border-gray-300 rounded-md"
        />
        <button
          onClick={() => removeFromCart(item._key)}
          className="text-red-500 hover:text-red-700"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default CartItem;

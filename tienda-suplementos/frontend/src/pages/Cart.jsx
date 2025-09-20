import React from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    // Implement checkout logic here
    console.log('Proceeding to checkout with items:', items);
    // You can navigate to a checkout page or integrate with a payment gateway
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
        <button
          onClick={() => navigate('/products')}
          className="btn-primary"
        >
          Continuar Comprando
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tu Carrito de Compras</h1>
      
      <div className="bg-white rounded-lg shadow-md">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end">
        <div className="text-xl font-semibold mb-4">
          Total: ${calculateTotal().toFixed(2)}
        </div>
        
        <div className="space-x-4">
          <button
            onClick={clearCart}
            className="btn-secondary"
          >
            Vaciar Carrito
          </button>
          <button
            onClick={handleCheckout}
            className="btn-primary"
          >
            Proceder al Pago
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

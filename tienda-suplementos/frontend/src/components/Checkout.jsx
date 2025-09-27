import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Alert from './Alert';

const Checkout = () => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  // Estados del formulario
  const [shippingData, setShippingData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Argentina'
  });

  const [paymentMethod, setPaymentMethod] = useState('mercadopago');

  // Validar formulario
  const validateForm = () => {
    const required = ['street', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingData[field].trim()) {
        setAlert({
          show: true,
          message: `El campo ${field} es requerido`,
          type: 'error'
        });
        return false;
      }
    }
    return true;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Procesar pago
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (items.length === 0) {
      setAlert({
        show: true,
        message: 'El carrito está vacío',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: '', type: 'info' });

    try {
      // Preparar datos de la orden
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: shippingData,
        paymentMethod,
        totalAmount: getTotalPrice()
      };

      if (paymentMethod === 'mercadopago') {
        // Crear preferencia de MercadoPago
        const response = await api.post('/payments/create-preference', orderData);
        
        if (response.data.success) {
          // Redirigir a MercadoPago
          window.location.href = response.data.init_point;
        } else {
          throw new Error(response.data.message || 'Error al procesar el pago');
        }
      } else {
        // Para otros métodos de pago (transferencia, efectivo)
        const response = await api.post('/orders/create', orderData);
        
        if (response.data.success) {
          clearCart();
          navigate(`/order-confirmation/${response.data.orderId}`);
        } else {
          throw new Error(response.data.message || 'Error al crear la orden');
        }
      }

    } catch (error) {
      console.error('Error en checkout:', error);
      setAlert({
        show: true,
        message: error.response?.data?.message || error.message || 'Error al procesar la orden',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega algunos productos antes de finalizar tu compra.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: '', type: 'info' })}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de datos */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Información de Envío</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="street"
                  value={shippingData.street}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Av. Corrientes 1234"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={shippingData.city}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Buenos Aires"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={shippingData.state}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: CABA"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={shippingData.zipCode}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 1001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={shippingData.country}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                    readOnly
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Método de Pago</h2>
            
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mercadopago"
                  checked={paymentMethod === 'mercadopago'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3 text-blue-600"
                />
                <div className="flex items-center">
                  <img 
                    src="https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368aaf-m.svg" 
                    alt="MercadoPago"
                    className="h-8 mr-3"
                  />
                  <div>
                    <div className="font-medium">MercadoPago</div>
                    <div className="text-sm text-gray-600">Tarjetas, efectivo y más</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="transferencia"
                  checked={paymentMethod === 'transferencia'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="font-medium">Transferencia Bancaria</div>
                  <div className="text-sm text-gray-600">Te enviaremos los datos por email</div>
                </div>
              </label>

              <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="efectivo"
                  checked={paymentMethod === 'efectivo'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3 text-blue-600"
                />
                <div>
                  <div className="font-medium">Pago en Efectivo</div>
                  <div className="text-sm text-gray-600">Al momento de la entrega</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Resumen de la orden */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Resumen de tu Orden</h2>
          
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">Cantidad: {item.quantity}</div>
                </div>
                <div className="font-medium">
                  ${(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
            
            <hr className="border-gray-200" />
            
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total:</span>
              <span>${getTotalPrice().toLocaleString()}</span>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </div>
              ) : (
                `Finalizar Compra - $${getTotalPrice().toLocaleString()}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
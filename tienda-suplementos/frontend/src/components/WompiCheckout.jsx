import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const WompiCheckout = () => {
  const { items, clearCart, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Verificar si hay items en el carrito
  if (!items || items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Carrito Vacío</h1>
          <p className="text-gray-600 mb-6">No tienes productos en tu carrito.</p>
          <a href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            Ver Productos
          </a>
        </div>
      </div>
    );
  }

  // Estados para el formulario
  const [customerData, setCustomerData] = useState({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phoneNumber: user?.phone || '',
    legalId: '',
    legalIdType: 'CC'
  });

  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    region: '',
    country: 'CO',
    postalCode: '',
    phoneNumber: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errors, setErrors] = useState({});

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await api.get('/users/profile');
      
      if (response.data.success) {
        const profile = response.data.user;
        
        // Actualizar datos del cliente
        setCustomerData(prev => ({
          ...prev,
          fullName: profile.firstName && profile.lastName 
            ? `${profile.firstName} ${profile.lastName}` 
            : prev.fullName,
          email: profile.email || prev.email,
          phoneNumber: profile.phone || prev.phoneNumber
        }));

        // Actualizar dirección de envío desde shippingInfo si existe
        if (profile.shippingInfo && profile.shippingInfo.fullName) {
          setShippingAddress({
            addressLine1: profile.shippingInfo.street || '',
            addressLine2: profile.shippingInfo.addressLine2 || '',
            city: profile.shippingInfo.city || '',
            region: profile.shippingInfo.region || '',
            country: profile.shippingInfo.country || 'CO',
            postalCode: profile.shippingInfo.zipCode || '',
            phoneNumber: profile.shippingInfo.phoneNumber || profile.phone || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // No mostrar error, solo usar datos por defecto
    } finally {
      setLoadingProfile(false);
    }
  };

  // Validación de formulario simplificada
  const validateForm = () => {
    const newErrors = {};
    
    if (!customerData.fullName) newErrors.fullName = 'Nombre completo es requerido';
    if (!customerData.email) newErrors.email = 'Email es requerido';
    if (!customerData.phoneNumber) newErrors.phoneNumber = 'Teléfono es requerido';
    if (!customerData.legalId) newErrors.legalId = 'Cédula es requerida';
    
    if (!shippingAddress.addressLine1) newErrors.addressLine1 = 'Dirección es requerida';
    if (!shippingAddress.city) newErrors.city = 'Ciudad es requerida';
    if (!shippingAddress.region) newErrors.region = 'Departamento es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Preparar datos para la transacción
      const transactionData = {
        items: items.map(item => ({
          productId: item._id || item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        customerData,
        shippingAddress,
        total: getTotalPrice(),
        reference: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentMethod
      };

      console.log('🚀 Enviando datos a Wompi:', transactionData);

      // Llamar al backend para crear la transacción
      const response = await api.post('/payments/create-wompi-transaction', transactionData);

      if (response.data.success) {
        const { wompiData, orderId } = response.data;
        
        console.log('✅ Transacción creada exitosamente:', wompiData);
        console.log('✅ Orden ID:', orderId);
        
        if (wompiData && wompiData.reference) {
          console.log('🚀 Iniciando widget de Wompi...');
          
          // Redirigir al componente WompiPayment con los datos
          navigate('/wompi-payment', { 
            state: { 
              wompiData: wompiData,
              orderId: orderId 
            }
          });
          
        } else {
          console.warn('⚠️ wompiData incompleto:', wompiData);
          alert(`¡Orden creada exitosamente!\nID: ${orderId}\nProcede al pago manualmente.`);
        }
        
      } else {
        throw new Error(response.data.message || 'Error creando transacción');
      }
      
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      alert(`Error: ${error.response?.data?.message || error.message || 'Error procesando el pago'}`);
    } finally {
      setLoading(false);
    }
  };

  const regions = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 
    'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 
    'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 
    'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 
    'Valle del Cauca', 'Vaupés', 'Vichada'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🚀 Checkout con Wompi</h1>
          <p className="text-gray-600">Procesador de pagos especializado en Colombia</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Datos del Cliente */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">📱 Información del Cliente</h2>
                  {loadingProfile && (
                    <span className="text-sm text-blue-600">Cargando datos guardados...</span>
                  )}
                  <a 
                    href="/profile" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Editar en Perfil
                  </a>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={customerData.fullName}
                      onChange={(e) => setCustomerData({...customerData, fullName: e.target.value})}
                      className={`w-full p-3 border rounded-lg ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Juan Pérez"
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                      className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="juan@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono *</label>
                    <input
                      type="tel"
                      value={customerData.phoneNumber}
                      onChange={(e) => setCustomerData({...customerData, phoneNumber: e.target.value})}
                      className={`w-full p-3 border rounded-lg ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="3001234567"
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Documento</label>
                    <select
                      value={customerData.legalIdType}
                      onChange={(e) => setCustomerData({...customerData, legalIdType: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="NIT">NIT</option>
                      <option value="PP">Pasaporte</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Número de Documento *</label>
                    <input
                      type="text"
                      value={customerData.legalId}
                      onChange={(e) => setCustomerData({...customerData, legalId: e.target.value})}
                      className={`w-full p-3 border rounded-lg ${errors.legalId ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="12345678"
                    />
                    {errors.legalId && <p className="text-red-500 text-sm mt-1">{errors.legalId}</p>}
                  </div>
                </div>
              </div>

              {/* Dirección de Envío */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">📍 Dirección de Envío</h2>
                  <a 
                    href="/profile" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Guardar en Perfil
                  </a>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Dirección *</label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress({...shippingAddress, addressLine1: e.target.value})}
                      className={`w-full p-3 border rounded-lg ${errors.addressLine1 ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Calle 123 #45-67"
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Complemento (Opcional)</label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => setShippingAddress({...shippingAddress, addressLine2: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Apartamento, suite, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Ciudad *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className={`w-full p-3 border rounded-lg ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Bogotá"
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Departamento *</label>
                    <select
                      value={shippingAddress.region}
                      onChange={(e) => setShippingAddress({...shippingAddress, region: e.target.value})}
                      className={`w-full p-3 border rounded-lg ${errors.region ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Seleccionar...</option>
                      {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                    {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Código Postal</label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="110111"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono de Contacto</label>
                    <input
                      type="tel"
                      value={shippingAddress.phoneNumber}
                      onChange={(e) => setShippingAddress({...shippingAddress, phoneNumber: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="3001234567"
                    />
                  </div>
                </div>
              </div>

              {/* Método de Pago */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">💳 Método de Pago</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">💳 Tarjeta de Crédito/Débito</div>
                      <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pse"
                      checked={paymentMethod === 'pse'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">🏦 PSE</div>
                      <div className="text-sm text-gray-500">Pago Seguro Electrónico</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="nequi"
                      checked={paymentMethod === 'nequi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">📱 Nequi</div>
                      <div className="text-sm text-gray-500">Pago con tu cuenta Nequi</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Procesando...' : `Procesar Pago - $${getTotalPrice().toLocaleString('es-CO')}`}
              </button>
            </form>
          </div>

          {/* Resumen de la orden */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Resumen de la Orden</h2>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._key} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      ${(item.price * item.quantity).toLocaleString('es-CO')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${getTotalPrice().toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  🔒 Pago seguro procesado por Wompi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WompiCheckout;
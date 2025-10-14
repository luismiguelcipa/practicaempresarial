import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { items, getTotalPrice, addToCart } = useCart();
  const navigate = useNavigate();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  // Obtener productos relacionados reales de la base de datos
  const fetchRelatedProducts = useCallback(async () => {
    console.log('🔍 Iniciando fetchRelatedProducts (Cart page)...');
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = `${apiUrl}/products`;
      
      console.log('📡 Llamando a:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('📦 API Response completa (Cart):', data);
      console.log('📦 Productos recibidos (Cart):', data?.data?.length || 0);

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Obtener IDs de productos en el carrito
        const cartProductIds = items.map(item => item._id || item.id || item.productId).filter(Boolean);
        console.log('🛒 Productos en carrito (IDs):', cartProductIds);

        // Filtrar productos que NO están en el carrito
        let filtered = data.data.filter(product => {
          if (!product || !product._id) return false;
          return !cartProductIds.includes(product._id);
        });
        
        console.log('✅ Productos después de filtrar (Cart):', filtered.length);

        // Si hay productos, tomar los primeros 5
        if (filtered.length > 0) {
          const finalProducts = filtered.slice(0, 5);
          console.log('🎯 Productos finales a mostrar (Cart):', finalProducts);
          setRelatedProducts(finalProducts);
        } else {
          console.log('⚠️ No hay productos después del filtrado (Cart)');
          // Si todos están en el carrito, mostrar algunos de todos modos
          const someProducts = data.data.slice(0, 5);
          setRelatedProducts(someProducts);
        }
      } else {
        console.warn('⚠️ No se encontraron productos o estructura incorrecta (Cart)');
        setRelatedProducts([]);
      }
    } catch (error) {
      console.error('❌ Error al obtener productos relacionados (Cart):', error);
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      fetchRelatedProducts();
    }
  }, [items, fetchRelatedProducts]);

  const getTotalDiscount = () => {
    return items.reduce((total, item) => {
      const discount = (item.originalPrice - item.price) * item.quantity;
      return total + (discount > 0 ? discount : 0);
    }, 0);
  };

  const getOriginalTotal = () => {
    return items.reduce((total, item) => {
      const originalPrice = item.originalPrice || item.price;
      return total + (originalPrice * item.quantity);
    }, 0);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % relatedProducts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + relatedProducts.length) % relatedProducts.length);
  };

  const handleAddRelatedProduct = async (product) => {
    const productToAdd = {
      _id: product._id,
      id: product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      baseSize: product.baseSize
    };
    
    addToCart(productToAdd);
    
    // Actualizar productos relacionados
    await fetchRelatedProducts();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega productos para comenzar tu compra</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">Carrito de Compras</h1>
          <p className="text-gray-600">{items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito</p>
        </div>
        
        {/* Items del carrito */}
        <div className="bg-white rounded-lg shadow-md divide-y mb-6">
          {items.map((item) => (
            <CartItem key={item._key} item={item} />
          ))}
        </div>

        {/* También te puede gustar - SIEMPRE SE MUESTRA */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-center font-semibold text-lg mb-4">También te puede gustar</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-pulse">Cargando productos...</div>
            </div>
          ) : relatedProducts.length > 0 ? (
              <div className="relative">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
                    aria-label="Anterior"
                    disabled={relatedProducts.length <= 1}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {relatedProducts[currentSlide] && (
                    <div className="flex items-center gap-4 w-full px-12">
                      <img
                        src={relatedProducts[currentSlide].image || '/placeholder-product.jpg'}
                        alt={relatedProducts[currentSlide].name}
                        className="w-20 h-20 object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">{relatedProducts[currentSlide].name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {relatedProducts[currentSlide].originalPrice && (
                            <span className="text-gray-400 line-through text-sm">
                              ${relatedProducts[currentSlide].originalPrice?.toLocaleString()}
                            </span>
                          )}
                          <span className={relatedProducts[currentSlide].originalPrice ? "text-red-600 font-semibold text-lg" : "text-gray-800 font-semibold text-lg"}>
                            ${relatedProducts[currentSlide].price?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddRelatedProduct(relatedProducts[currentSlide])}
                        className="p-3 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
                        aria-label="Agregar al carrito"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v8M8 12h8" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={nextSlide}
                    className="absolute right-2 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
                    aria-label="Siguiente"
                    disabled={relatedProducts.length <= 1}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                {/* Dots */}
                {relatedProducts.length > 1 && (
                  <div className="flex justify-center gap-2 mt-3">
                    {relatedProducts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentSlide ? 'bg-black' : 'bg-gray-300'
                        }`}
                        aria-label={`Ir a producto ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No hay productos disponibles en este momento</p>
              </div>
            )}
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Resumen del Pedido</h2>
          
          {/* Subtotal con descuento */}
          <div className="space-y-2 mb-4 pb-4 border-b">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${getOriginalTotal().toLocaleString()}</span>
            </div>
            {getTotalDiscount() > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuentos</span>
                <span>-${getTotalDiscount().toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-baseline mb-6">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-2xl font-bold">${getTotalPrice().toLocaleString()} COP</span>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/products')}
              className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 text-center font-medium hover:bg-gray-50 transition-colors"
            >
              Continuar Comprando
            </button>
            <Link
              to="/wompi-checkout"
              className="block w-full px-6 py-3 rounded-lg bg-cyan-500 text-white text-center hover:bg-cyan-600 transition-colors font-medium uppercase tracking-wide"
            >
              Finalizar Compra
            </Link>
          </div>

          {/* Métodos de pago */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3 text-center">Métodos de pago aceptados:</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">≡</span>
              </div>
              <div className="px-3 py-2 border rounded text-sm font-semibold">Nequi</div>
              <div className="px-3 py-2 border rounded text-sm font-semibold">Daviplata</div>
              <div className="px-3 py-2 border rounded text-sm font-semibold">Addi</div>
              <div className="px-3 py-2 border rounded text-sm font-semibold text-blue-900">VISA</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>imnnutrition.co</p>
          <p className="mt-2">Compra segura y protegida</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;

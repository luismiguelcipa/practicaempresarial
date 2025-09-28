import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState, useMemo } from 'react';

// ProductCard ahora soporta variantes (variants) y sabores (flavors) opcionales.
// Lógica:
// - Si variants?.length > 1 se muestra selector de tamaños.
// - Si flavors?.length > 1 se muestra selector de sabor.
// - Si solo hay 0 o 1 elemento en cualquiera, no se muestra select y se usa directamente.
// - Precio e imagen cambian según la variante seleccionada.
// - Al agregar al carrito se añade variantId y flavor (si existen) y el unitPrice calculado.

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const variants = useMemo(() => Array.isArray(product.variants) ? product.variants : [], [product.variants]);
  const flavors = useMemo(() => Array.isArray(product.flavors) ? product.flavors : [], [product.flavors]);

  // Construimos un conjunto de "opciones de tamaño" donde el tamaño base también es seleccionable si existe.
  const sizeOptions = useMemo(() => {
    const opts = [];
    if (product.baseSize) {
      opts.push({
        _id: 'BASE',
        size: product.baseSize,
        price: product.price,
        image: product.image,
        stock: product.stock,
        __isBase: true
      });
    }
    variants.forEach(v => {
      if (v && v.size) opts.push(v);
    });
    return opts;
  }, [product.baseSize, product.price, product.image, product.stock, variants]);

  const [selectedSizeId, setSelectedSizeId] = useState(sizeOptions.length ? String(sizeOptions[0]._id) : null);
  const [selectedFlavor, setSelectedFlavor] = useState(flavors.length > 0 ? flavors[0] : null);

  const selectedSize = useMemo(() => {
    if (!sizeOptions.length) return null;
    return sizeOptions.find(o => String(o._id) === selectedSizeId) || sizeOptions[0];
  }, [sizeOptions, selectedSizeId]);

  const displayPrice = selectedSize ? selectedSize.price : product.price;
  const displayImage = selectedSize && selectedSize.image ? selectedSize.image : product.image;
  const displayStock = selectedSize && typeof selectedSize.stock === 'number' ? selectedSize.stock : product.stock;

  const multipleSizes = sizeOptions.length > 1; // ahora incluye base + variantes
  const multipleFlavors = flavors.length > 1;

  const handleAddToCart = (e) => {
    e.preventDefault();
    const cartItem = {
      ...product,
      // sobreescribir campos dependientes de variante
      price: displayPrice,
      image: displayImage,
      variantId: selectedSize && !selectedSize.__isBase ? selectedSize._id : null,
      size: selectedSize ? selectedSize.size : (product.baseSize || null),
      flavor: selectedFlavor
    };
    addToCart(cartItem);
  };

  return (
    <div className="bg-black p-6 rounded-xl shadow-lg">
      <div className="bg-black rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105">
        <Link to={`/product/${product.id || product._id}`} className="block">
          <div className="relative">
            <img
              className="w-full h-56 object-cover"
              src={displayImage || '/placeholder-product.png'}
              alt={product.name}
            />
          </div>
        </Link>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{product.description || product.category}</p>
          <div className="flex items-baseline my-3">
            <span className="text-2xl font-bold text-white">${displayPrice}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice}</span>
            )}
          </div>

          {/* Mostrar tamaño base si no hay selector (solo una opción) */}
          {(sizeOptions.length === 1 && product.baseSize) && (
            <p className="text-xs text-gray-400 mb-3">Tamaño: {product.baseSize}</p>
          )}

          {/* Selects condicionales */}
          {(multipleSizes || multipleFlavors) && (
            <div className="space-y-3 mb-4">
              {multipleSizes && (
                <select
                  value={selectedSize?._id || ''}
                  onChange={(e)=> setSelectedSizeId(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-red-500/40"
                >
                  {sizeOptions.map(o => (
                    <option key={o._id} value={o._id}>{o.size}</option>
                  ))}
                </select>
              )}
              {multipleFlavors && (
                <select
                  value={selectedFlavor || ''}
                  onChange={(e)=> setSelectedFlavor(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-red-500/40"
                >
                  {flavors.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {!multipleSizes && !multipleFlavors && <div className="h-12" />}

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || (displayStock !== undefined && displayStock <= 0)}
            className={`w-full text-white font-bold py-2 px-4 rounded-full transition ${
              product.inStock && (displayStock === undefined || displayStock > 0)
                ? 'bg-red-600 hover:bg-blue-700'
                : 'bg-gray-600 cursor-not-allowed opacity-60'
            }`}
            aria-label="Añadir al carrito"
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <ShoppingCart size={16} />
              {product.inStock && (displayStock === undefined || displayStock > 0) ? 'Añadir al carrito' : 'Agotado'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useState, useMemo } from 'react';
import QuickAddModal from './QuickAddModal';

// ProductCard ahora soporta variantes (variants) y sabores (flavors) opcionales.
// Lógica:
// - Si variants?.length > 1 se muestra selector de tamaños.
// - Si flavors?.length > 1 se muestra selector de sabor.
// - Si solo hay 0 o 1 elemento en cualquiera, no se muestra select y se usa directamente.
// - Precio e imagen cambian según la variante seleccionada.
// - Al agregar al carrito se añade variantId y flavor (si existen) y el unitPrice calculado.

const ProductCard = ({ product }) => {
  const variants = useMemo(() => Array.isArray(product.variants) ? product.variants : [], [product.variants]);
  const sizeOptions = useMemo(() => {
    const opts = [];
    if (product.baseSize) {
      opts.push({ _id: 'BASE', size: product.baseSize, price: product.price, image: product.image, stock: product.stock, __isBase: true });
    }
    variants.forEach(v => { if (v && v.size) opts.push(v); });
    return opts;
  }, [product.baseSize, product.price, product.image, product.stock, variants]);
  const displayPrice = sizeOptions.length ? sizeOptions[0].price : product.price;
  const displayImage = sizeOptions.length && sizeOptions[0].image ? sizeOptions[0].image : product.image;
  const displayStock = sizeOptions.length && typeof sizeOptions[0].stock === 'number' ? sizeOptions[0].stock : product.stock;

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const handleOpenQuickAdd = (e) => { e.preventDefault(); setQuickAddOpen(true); };


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

          <div className="h-10" />

          <button
            onClick={handleOpenQuickAdd}
            disabled={!product.inStock || (displayStock !== undefined && displayStock <= 0)}
            className={`w-full text-white font-bold py-2 px-4 rounded-full transition ${product.inStock && (displayStock === undefined || displayStock > 0) ? 'bg-red-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed opacity-60'}`}
            aria-label="Elegir opciones y añadir"
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <ShoppingCart size={16} />
              {product.inStock && (displayStock === undefined || displayStock > 0) ? 'Agregar' : 'Agotado'}
            </span>
          </button>
          <QuickAddModal product={product} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

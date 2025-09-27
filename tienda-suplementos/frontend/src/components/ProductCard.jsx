import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <div className="bg-black p-6 rounded-xl shadow-lg">
      <div className="bg-black rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105">
        <Link to={`/product/${product.id}`} className="block">
          <div className="relative">
            <img
              className="w-full h-56 object-cover"
              src={product.image || '/placeholder-product.png'}
              alt={product.name}
            />
          </div>
        </Link>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
          <p className="text-sm text-gray-400 mt-1">{product.description || product.category}</p>
          <div className="flex items-baseline my-3">
            <span className="text-2xl font-bold text-white">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice}</span>
            )}
          </div>
          <div className="h-12"></div>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`w-full text-white font-bold py-2 px-4 rounded-full transition ${
              product.inStock
                ? 'bg-red-600 hover:bg-blue-700'
                : 'bg-gray-600 cursor-not-allowed opacity-60'
            }`}
            aria-label="Añadir al carrito"
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <ShoppingCart size={16} />
              {product.inStock ? 'Añadir al carrito' : 'Agotado'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

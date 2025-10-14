import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import ProductCard from './ProductCard';

/**
 * Componente de pestañas para filtrar productos y combos por objetivo (Volumen/Definición)
 * Muestra los productos destacados arriba y debajo muestra productos y combos filtrados
 */
export default function FeaturedTypeTabs({ products }) {
  const types = ['Volumen', 'Definición'];
  const [selectedType, setSelectedType] = useState('Volumen');
  const [combos, setCombos] = useState([]);
  const [combosLoading, setCombosLoading] = useState(true);

  // Obtener combos de la API
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setCombosLoading(true);
        const { data } = await axios.get('/api/combos');
        setCombos(data || []);
      } catch (error) {
        console.error('Error cargando combos:', error);
      } finally {
        setCombosLoading(false);
      }
    };

    fetchCombos();
  }, []);

  // Filtrar productos por tipo seleccionado
  const filteredProducts = products.filter(product => {
    // Si el producto no tiene objetivo definido, no mostrarlo aquí
    if (!product.objetivo) return false;
    return product.objetivo === selectedType;
  });

  // Filtrar combos por categoría seleccionada
  const filteredCombos = combos.filter(combo => {
    return combo.category === selectedType && combo.inStock;
  });

  // Combinar productos y combos
  const allItems = [...filteredProducts, ...filteredCombos];

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-center border-b-2 border-gray-300 w-full max-w-4xl mb-8">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`
              px-8 py-3 font-bold text-lg rounded-t-lg transition-all duration-300 focus:outline-none
              ${selectedType === type
                ? 'bg-red-600 text-white border-b-4 border-red-600 transform -translate-y-1'
                : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600'
              }
            `}
          >
            {type}
          </button>
        ))}
      </div>
      
      {/* Grid de productos y combos filtrados */}
      <div className="w-full">
        <div className="text-center mb-6">
          <span className="text-sm text-gray-600">
            Productos y Combos para <span className="font-bold text-red-600">{selectedType}</span>
          </span>
        </div>
        
        {combosLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allItems.map(item => (
              <ProductCard 
                key={item.id || item._id} 
                product={item} 
                isCombo={!!item.category && (item.category === 'Volumen' || item.category === 'Definición')}
              />
            ))}
          </div>
        )}
        
        {!combosLoading && allItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay productos ni combos disponibles para {selectedType}</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

// Definición de tipos por categoría
const CATEGORY_TYPES = {
  'Proteínas': ['Limpia', 'Hipercalórica', 'Vegana'],
  'Creatina': ['Monohidrato', 'HCL']
};

/**
 * Componente de pestañas para filtrar productos por tipo/subcategoría
 * Solo se muestra para categorías que tienen tipos definidos (Proteínas, Creatina)
 */
export default function CategoryTypeTabs({ category, products, onFilteredProducts }) {
  const types = CATEGORY_TYPES[category];
  const [selectedType, setSelectedType] = useState(types?.[0] || '');
  
  // Obtener tipo por defecto para productos sin tipo definido
  const getDefaultType = (cat) => {
    if (cat === 'Proteínas') return 'Limpia';
    if (cat === 'Creatina') return 'Monohidrato';
    return null;
  };

  // Filtrar productos por tipo seleccionado
  const filterProducts = (type) => {
    if (onFilteredProducts && products) {
      // Filtrar productos que coincidan con el tipo seleccionado
      // Si un producto no tiene tipo, asumimos el tipo por defecto según la categoría
      const filtered = products.filter(product => {
        const productType = product.tipo || getDefaultType(category);
        return productType === type;
      });
      
      onFilteredProducts(filtered);
    }
  };

  // Manejar cambio de tipo
  const handleTypeChange = (type) => {
    setSelectedType(type);
    filterProducts(type);
  };

  // Inicializar filtrado al montar el componente o cuando cambien productos
  useEffect(() => {
    if (types && types.length > 0) {
      filterProducts(selectedType || types[0]);
    } else if (onFilteredProducts) {
      // Si no hay tipos, pasar todos los productos
      onFilteredProducts(products || []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, category]);
  
  // Si la categoría no tiene tipos, no mostrar nada
  if (!types || types.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full mb-8">
      <div className="flex justify-center border-b-2 border-gray-300 w-full max-w-4xl">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`
              px-6 py-3 font-bold rounded-t-lg transition-all duration-300 focus:outline-none
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
      
      {/* Indicador visual del tipo seleccionado */}
      <div className="mt-4 text-center">
        <span className="text-sm text-gray-600">
          Mostrando: <span className="font-bold text-red-600">{selectedType}</span>
        </span>
      </div>
    </div>
  );
}

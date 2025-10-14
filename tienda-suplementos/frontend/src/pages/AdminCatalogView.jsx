import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';

const AdminCatalogView = () => {
  const navigate = useNavigate();

  const categories = [
    {
      name: 'Proteínas',
      path: '/products/proteinas',
      count: 5,
      icon: '🥤',
      color: 'bg-red-50 border-red-200'
    },
    {
      name: 'Creatina',
      path: '/products/creatina',
      count: 3,
      icon: '💪',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Aminoácidos',
      path: '/products/aminoacidos',
      count: 1,
      icon: '🧪',
      color: 'bg-green-50 border-green-200'
    },
    {
      name: 'Pre-Workout',
      path: '/products/pre-workout',
      count: 1,
      icon: '⚡',
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      name: 'Vitaminas',
      path: '/products/vitaminas',
      count: 2,
      icon: '💊',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      name: 'Para la salud',
      path: '/products/para-la-salud',
      count: 0,
      icon: '❤️',
      color: 'bg-pink-50 border-pink-200'
    },
    {
      name: 'Complementos',
      path: '/products/complementos',
      count: 0,
      icon: '🌿',
      color: 'bg-teal-50 border-teal-200'
    },
    {
      name: 'Comida',
      path: '/products/comida',
      count: 0,
      icon: '🍽️',
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Volver a categorías</span>
          </button>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Categoría: Proteínas</h1>
          <p className="text-gray-600">Selecciona un tipo para gestionar sus productos.</p>
        </div>

        {/* Categories Grid - Igual que la imagen 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <button
              key={category.path}
              onClick={() => navigate(category.path)}
              className={`${category.color} border-2 rounded-xl p-6 text-left transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="flex flex-col space-y-4">
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full text-3xl">
                  {category.icon}
                </div>

                {/* Category Name */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.count} {category.count === 1 ? 'producto' : 'productos'}
                  </p>
                </div>

                {/* Stock Indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${category.count > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-xs font-medium text-gray-700">
                    {category.count}
                  </span>
                </div>

                {/* Action Link */}
                <div className="mt-auto">
                  <span className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1">
                    Ver Productos
                    <span>→</span>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCatalogView;

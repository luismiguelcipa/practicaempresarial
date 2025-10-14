import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Dumbbell, TrendingUp, Activity, Package } from 'lucide-react';

const AdminPageManagement = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Catálogo',
      icon: Package,
      description: 'Gestionar categorías de productos',
      path: '/admin/catalog',
      color: 'from-red-50 to-pink-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      title: 'Accesorios',
      icon: Dumbbell,
      description: 'Gestionar accesorios y subcategorías',
      path: '/admin/accessories',
      color: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Volumen',
      icon: TrendingUp,
      description: 'Ver productos de volumen',
      path: '/products/volumen',
      color: 'from-purple-50 to-indigo-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Definición',
      icon: Activity,
      description: 'Ver productos de definición',
      path: '/products/definicion',
      color: 'from-orange-50 to-amber-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Inicio',
      icon: ShoppingBag,
      description: 'Ir a la página de inicio',
      path: '/',
      color: 'from-gray-50 to-slate-50',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700'
    }
  ];

  return (
    <div className="container mx-auto px-6 py-8 mt-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Administración de Página</h2>
        <p className="text-gray-600">Navega por las diferentes secciones de la tienda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.path}
              onClick={() => navigate(section.path)}
              className={`bg-gradient-to-br ${section.color} border-2 border-gray-200 rounded-2xl p-6 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:-translate-y-1`}
            >
              <div className="flex flex-col space-y-4">
                {/* Icon */}
                <div className={`${section.iconBg} w-16 h-16 rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon size={32} className={section.iconColor} />
                </div>
                
                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {section.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="flex items-center text-red-600 font-semibold text-sm pt-2">
                  <span>Administrar</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPageManagement;
